import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { OrderStatus, Prisma } from '@prisma-order/client';
import { randomUUID } from 'crypto';
import type { AuthUserResponse } from '@contracts/auth/auth.contracts';
import type {
  CreateOrderCheckoutBody,
  CreateOrderCheckoutRpcRequest,
  GetMyOrderRpcRequest,
  ListMyOrdersRpcRequest,
  OrderCheckoutResponseDto,
  OrderDetailDto,
  OrderLineItemDto,
  OrderStatusCode,
  OrderSummaryDto,
} from '@contracts/orders/orders.contracts';
import {
  CATALOG_MESSAGE_PATTERN,
  type CatalogValidateCheckoutLinesResponse,
} from '@contracts/catalog/catalog.contracts';
import {
  PAYMENTS_MESSAGE_PATTERN,
  type CreatePaymentForOrderRequest,
  type ListPaymentsByOrderIdResponse,
  type PaymentStatusCode,
  type PaymentForOrderDto,
} from '@contracts/payments/payments.contracts';
import {
  USER_MESSAGE_PATTERN,
  type UserCheckExistsResponse,
} from '@contracts/users/users.contracts';
import { connectKafkaClientWithRetry } from '@common/utils/connect-kafka-client-with-retry';
import { createKafkaMessageEnvelope } from '@common/utils/kafka-message-envelope';
import { requestKafkaRpc } from '@common/utils/request-kafka-rpc';
import { verifyJwt } from '@common/utils/verify-jwt';
import { OrderRepository } from './order.repository';

const DEFAULT_CURRENCY: string = 'VND';
const MAX_CHECKOUT_LINES: number = 50;
const MAX_NOTES_LENGTH: number = 2000;
const CHECKOUT_SAGA_STEP_PAYMENT: string = 'PAYMENT';

type MergedLine = {
  readonly productId: string;
  readonly quantity: number;
};

type ResolvedLine = {
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly lineTotal: number;
};

type CheckoutContext = {
  readonly authUser: AuthUserResponse;
  readonly mergedLines: readonly MergedLine[];
  readonly notes: string | null;
  readonly shippingSnapshot: Prisma.InputJsonValue;
  readonly shippingAddressId: string;
  readonly paymentProvider: CreatePaymentForOrderRequest['provider'];
  readonly initialOrderStatus: OrderStatus;
};

@Injectable()
export class OrderService implements OnModuleInit {
  private readonly logger: Logger = new Logger(OrderService.name);
  public constructor(
    private readonly orderRepository: OrderRepository,
    @Inject('USER_SERVICE_CLIENT')
    private readonly userServiceClient: ClientKafka,
    @Inject('PRODUCT_SERVICE_CLIENT')
    private readonly productServiceClient: ClientKafka,
    @Inject('PAYMENT_SERVICE_CLIENT')
    private readonly paymentServiceClient: ClientKafka,
  ) {}
  public async onModuleInit(): Promise<void> {
    this.userServiceClient.subscribeToResponseOf(
      USER_MESSAGE_PATTERN.checkExists,
    );
    this.productServiceClient.subscribeToResponseOf(
      CATALOG_MESSAGE_PATTERN.validateCheckoutLines,
    );
    this.paymentServiceClient.subscribeToResponseOf(
      PAYMENTS_MESSAGE_PATTERN.createForOrder,
    );
    this.paymentServiceClient.subscribeToResponseOf(
      PAYMENTS_MESSAGE_PATTERN.listByOrderId,
    );
    await connectKafkaClientWithRetry({ client: this.userServiceClient });
    await connectKafkaClientWithRetry({ client: this.productServiceClient });
    await connectKafkaClientWithRetry({ client: this.paymentServiceClient });
  }

  public async createCheckout(
    payload: CreateOrderCheckoutRpcRequest,
  ): Promise<OrderCheckoutResponseDto> {
    const context: CheckoutContext = this.buildCheckoutContext(payload);
    this.recordSagaEvent({
      step: 'START',
      status: 'STARTED',
      userId: context.authUser.id,
    });
    await this.ensureUserExists(context.authUser.id);
    const resolvedLines: ResolvedLine[] = await this.validateCheckoutLines({
      userId: context.authUser.id,
      mergedLines: context.mergedLines,
    });
    const totalAmountVnd: number = this.calculateTotalAmount(resolvedLines);
    const order = await this.orderRepository.createCheckoutOrder({
      userId: context.authUser.id,
      shippingAddressId: context.shippingAddressId,
      shippingAddressSnapshot: context.shippingSnapshot,
      orderStatus: context.initialOrderStatus,
      total: totalAmountVnd,
      notes: context.notes,
      lines: resolvedLines,
      currency: DEFAULT_CURRENCY,
    });
    let payment: PaymentForOrderDto;
    try {
      this.recordSagaEvent({
        step: 'PAYMENT',
        status: 'STARTED',
        userId: context.authUser.id,
        orderId: order.orderId,
      });
      payment = await this.createPaymentForOrder({
        orderId: order.orderId,
        userId: context.authUser.id,
        amountVnd: totalAmountVnd,
        provider: context.paymentProvider,
      });
    } catch {
      await this.orderRepository.updateOrderStatus({
        orderId: order.orderId,
        status: OrderStatus.CANCELLED,
      });
      this.recordSagaEvent({
        step: 'PAYMENT',
        status: 'COMPENSATED',
        userId: context.authUser.id,
        orderId: order.orderId,
      });
      throw new RpcException({
        status: HttpStatus.BAD_GATEWAY,
        message: `Checkout saga compensation executed at ${CHECKOUT_SAGA_STEP_PAYMENT}`,
      });
    }
    const nextOrderStatus: OrderStatus = this.resolveOrderStatusAfterPayment(
      payment.status,
    );
    const finalOrderStatus: OrderStatus =
      nextOrderStatus !== order.status
        ? await this.orderRepository.updateOrderStatus({
            orderId: order.orderId,
            status: nextOrderStatus,
          })
        : order.status;
    this.recordSagaEvent({
      step: 'FINALIZE',
      status: 'SUCCEEDED',
      userId: context.authUser.id,
      orderId: order.orderId,
    });
    return {
      orderId: order.orderId,
      status: String(finalOrderStatus) as OrderStatusCode,
      totalVnd: order.totalVnd,
      currency: order.currency,
      payment,
    };
  }

  private buildCheckoutContext(
    payload: CreateOrderCheckoutRpcRequest,
  ): CheckoutContext {
    const authUser: AuthUserResponse = this.requireAuthUser(
      payload.accessToken,
    );
    const body: CreateOrderCheckoutBody = payload.body;
    const mergedLines: MergedLine[] = this.mergeOrderItems(body.items);
    if (mergedLines.length === 0) {
      this.throwBadRequest('Cart is empty');
    }
    if (mergedLines.length > MAX_CHECKOUT_LINES) {
      this.throwBadRequest('Too many distinct products in order');
    }
    const notes: string | null = this.normalizeNotes(body.notes);
    const shippingAddressId: string = randomUUID();
    const shippingSnapshot: Prisma.InputJsonValue = this.buildShippingSnapshot({
      addressId: shippingAddressId,
      input: body.shippingAddress,
    });
    const paymentProvider: CreatePaymentForOrderRequest['provider'] =
      this.parsePaymentProvider(body.paymentProvider);
    const initialOrderStatus: OrderStatus =
      paymentProvider === 'COD'
        ? OrderStatus.CONFIRMED
        : OrderStatus.PENDING_PAYMENT;
    return {
      authUser,
      mergedLines,
      notes,
      shippingSnapshot,
      shippingAddressId,
      paymentProvider,
      initialOrderStatus,
    };
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const userCheck: UserCheckExistsResponse = await requestKafkaRpc<
      UserCheckExistsResponse,
      { readonly key: string; readonly value: { readonly userId: string } }
    >({
      client: this.userServiceClient,
      pattern: USER_MESSAGE_PATTERN.checkExists,
      payload: createKafkaMessageEnvelope({
        key: userId,
        value: { userId },
      }),
    });
    if (!userCheck.exists) {
      this.throwNotFound('User not found');
    }
  }

  private async validateCheckoutLines(input: {
    readonly userId: string;
    readonly mergedLines: readonly MergedLine[];
  }): Promise<ResolvedLine[]> {
    const validated: CatalogValidateCheckoutLinesResponse =
      await requestKafkaRpc<
        CatalogValidateCheckoutLinesResponse,
        {
          readonly key: string;
          readonly value: { readonly items: readonly MergedLine[] };
        }
      >({
        client: this.productServiceClient,
        pattern: CATALOG_MESSAGE_PATTERN.validateCheckoutLines,
        payload: createKafkaMessageEnvelope({
          key: input.userId,
          value: { items: input.mergedLines },
        }),
        timeoutMs: 10000,
      });
    return validated.lines.map(
      (line): ResolvedLine => ({
        productId: line.productId,
        productName: line.productName,
        sku: line.sku,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      }),
    );
  }

  private calculateTotalAmount(lines: readonly ResolvedLine[]): number {
    return lines.reduce(
      (sum: number, line: ResolvedLine) => sum + line.lineTotal,
      0,
    );
  }

  private async createPaymentForOrder(
    input: CreatePaymentForOrderRequest,
  ): Promise<PaymentForOrderDto> {
    try {
      return await requestKafkaRpc<
        PaymentForOrderDto,
        { readonly key: string; readonly value: CreatePaymentForOrderRequest }
      >({
        client: this.paymentServiceClient,
        pattern: PAYMENTS_MESSAGE_PATTERN.createForOrder,
        payload: createKafkaMessageEnvelope({
          key: input.orderId,
          value: input,
        }),
        timeoutMs: 10000,
      });
    } catch {
      throw new RpcException({
        status: HttpStatus.BAD_GATEWAY,
        message: `Checkout saga failed at ${CHECKOUT_SAGA_STEP_PAYMENT}`,
      });
    }
  }

  private resolveOrderStatusAfterPayment(
    paymentStatus: PaymentStatusCode,
  ): OrderStatus {
    if (paymentStatus === 'COMPLETED') {
      return OrderStatus.CONFIRMED;
    }
    if (paymentStatus === 'FAILED' || paymentStatus === 'REFUNDED') {
      return OrderStatus.CANCELLED;
    }
    return OrderStatus.PENDING_PAYMENT;
  }

  public async listMyOrders(
    payload: ListMyOrdersRpcRequest,
  ): Promise<OrderSummaryDto[]> {
    const authUser: AuthUserResponse = this.requireAuthUser(
      payload.accessToken,
    );
    const rows = await this.orderRepository.listOrdersByUserId(authUser.id);
    return rows.map(
      (row): OrderSummaryDto => ({
        id: row.id,
        status: String(row.status) as OrderStatusCode,
        totalVnd: Number(row.total),
        currency: row.currency,
        placedAt: row.placedAt.toISOString(),
      }),
    );
  }

  public async getMyOrderById(
    payload: GetMyOrderRpcRequest,
  ): Promise<OrderDetailDto> {
    const authUser: AuthUserResponse = this.requireAuthUser(
      payload.accessToken,
    );
    const trimmed: string = payload.orderId.trim();
    if (trimmed.length === 0) {
      this.throwBadRequest('Invalid order id');
    }
    const row = await this.orderRepository.findOrderDetailByUserId({
      userId: authUser.id,
      orderId: trimmed,
    });
    if (row === null) {
      this.throwNotFound('Order not found');
    }
    const items: OrderLineItemDto[] = row.items.map(
      (item): OrderLineItemDto => ({
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPriceVnd: Number(item.unitPrice),
        lineTotalVnd: Number(item.lineTotal),
      }),
    );
    return {
      id: row.id,
      status: String(row.status) as OrderStatusCode,
      currency: row.currency,
      subtotalVnd: Number(row.subtotal),
      taxAmountVnd: Number(row.taxAmount),
      shippingAmountVnd: Number(row.shippingAmount),
      discountAmountVnd: Number(row.discountAmount),
      totalVnd: Number(row.total),
      notes: row.notes,
      placedAt: row.placedAt.toISOString(),
      shippingAddressSnapshot: row.shippingAddressSnapshot,
      items,
      payments: await this.loadPaymentsByOrderId(row.id),
    };
  }

  private requireAuthUser(accessToken: string): AuthUserResponse {
    const verifyResult = verifyJwt({ accessToken });
    if (!verifyResult.isValid || !verifyResult.user) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      });
    }
    return verifyResult.user;
  }

  private throwBadRequest(message: string): never {
    throw new RpcException({
      status: HttpStatus.BAD_REQUEST,
      message,
    });
  }

  private throwNotFound(message: string): never {
    throw new RpcException({
      status: HttpStatus.NOT_FOUND,
      message,
    });
  }

  private mergeOrderItems(
    items: readonly { readonly productId: string; readonly quantity: number }[],
  ): MergedLine[] {
    const map: Map<string, number> = new Map();
    for (const raw of items) {
      const productId: string = raw.productId.trim();
      const quantity: number = Math.floor(Number(raw.quantity));
      if (
        productId.length === 0 ||
        !Number.isFinite(quantity) ||
        quantity < 1
      ) {
        continue;
      }
      const prev: number = map.get(productId) ?? 0;
      map.set(productId, prev + quantity);
    }
    return [...map.entries()].map(
      ([productId, quantity]: [string, number]): MergedLine => ({
        productId,
        quantity,
      }),
    );
  }

  private normalizeNotes(notes: string | undefined): string | null {
    if (notes === undefined || notes === null) {
      return null;
    }
    const trimmed: string = notes.trim();
    if (trimmed.length === 0) {
      return null;
    }
    if (trimmed.length > MAX_NOTES_LENGTH) {
      this.throwBadRequest('notes is too long');
    }
    return trimmed;
  }

  private buildShippingSnapshot(input: {
    readonly addressId: string;
    readonly input: CreateOrderCheckoutBody['shippingAddress'];
  }): Prisma.InputJsonValue {
    const name: string = input.input.recipientName.trim();
    const phone: string = input.input.phone.trim();
    const line1: string = input.input.line1.trim();
    const ward: string = input.input.ward.trim();
    const district: string = input.input.district.trim();
    const city: string = input.input.city.trim();
    if (
      name.length === 0 ||
      phone.length === 0 ||
      line1.length === 0 ||
      ward.length === 0 ||
      district.length === 0 ||
      city.length === 0
    ) {
      this.throwBadRequest('Incomplete shipping address');
    }
    if (
      name.length > 120 ||
      phone.length > 40 ||
      line1.length > 240 ||
      ward.length > 120 ||
      district.length > 120 ||
      city.length > 120
    ) {
      this.throwBadRequest('Shipping address field too long');
    }
    const line2Raw: string | undefined = input.input.line2;
    const line2: string | undefined =
      line2Raw !== undefined && line2Raw.trim().length > 0
        ? line2Raw.trim().slice(0, 240)
        : undefined;
    const postalRaw: string | undefined = input.input.postalCode;
    const postalCode: string | undefined =
      postalRaw !== undefined && postalRaw.trim().length > 0
        ? postalRaw.trim().slice(0, 32)
        : undefined;
    const contactRaw: string | undefined = input.input.contactEmail;
    const contactEmail: string | undefined =
      contactRaw !== undefined && contactRaw.trim().length > 0
        ? contactRaw.trim().toLowerCase().slice(0, 254)
        : undefined;
    return {
      id: input.addressId,
      recipientName: name,
      phone,
      line1,
      ...(line2 !== undefined ? { line2 } : {}),
      ward,
      district,
      city,
      ...(postalCode !== undefined ? { postalCode } : {}),
      ...(contactEmail !== undefined ? { contactEmail } : {}),
    };
  }

  private parsePaymentProvider(
    raw: CreateOrderCheckoutBody['paymentProvider'],
  ): CreatePaymentForOrderRequest['provider'] {
    if (raw === 'COD') {
      return 'COD';
    }
    if (raw === 'MANUAL') {
      return 'MANUAL';
    }
    this.throwBadRequest('Unsupported paymentProvider; use COD or MANUAL');
  }

  private async loadPaymentsByOrderId(
    orderId: string,
  ): Promise<readonly PaymentForOrderDto[]> {
    const response: ListPaymentsByOrderIdResponse = await requestKafkaRpc<
      ListPaymentsByOrderIdResponse,
      { readonly key: string; readonly value: { readonly orderId: string } }
    >({
      client: this.paymentServiceClient,
      pattern: PAYMENTS_MESSAGE_PATTERN.listByOrderId,
      payload: createKafkaMessageEnvelope({
        key: orderId,
        value: { orderId },
      }),
    });
    return response.payments;
  }

  private recordSagaEvent(input: {
    readonly step: 'START' | 'PAYMENT' | 'FINALIZE';
    readonly status: 'STARTED' | 'SUCCEEDED' | 'COMPENSATED';
    readonly userId: string;
    readonly orderId?: string;
  }): void {
    this.logger.log(
      JSON.stringify({
        event: 'order_checkout_saga',
        step: input.step,
        status: input.status,
        userId: input.userId,
        ...(input.orderId !== undefined ? { orderId: input.orderId } : {}),
      }),
    );
  }
}
