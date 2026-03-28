import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PaymentProvider } from '@prisma-payment/client';
import type {
  CreatePaymentForOrderRequest,
  ListPaymentsByOrderIdResponse,
  PaymentForOrderDto,
  PaymentProviderCode,
  PaymentStatusCode,
} from '@contracts/payments/payments.contracts';
import { PaymentRepository } from './payment.repository';
import { PaymentMethodStrategyFactory } from './strategies/payment-method-strategy.factory';

const DEFAULT_CURRENCY: string = 'VND';

@Injectable()
export class PaymentService {
  public constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentMethodStrategyFactory: PaymentMethodStrategyFactory,
  ) {}

  public async createPaymentForOrder(
    input: CreatePaymentForOrderRequest,
  ): Promise<PaymentForOrderDto> {
    const provider: PaymentProvider = this.parsePaymentProvider(input.provider);
    const paymentMethod = this.paymentMethodStrategyFactory.resolve(provider);
    const paymentState = paymentMethod.buildState();
    const payment = await this.paymentRepository.createPaymentForOrder({
      orderId: input.orderId,
      amountVnd: input.amountVnd,
      provider,
      status: paymentState.paymentStatus,
      currency: DEFAULT_CURRENCY,
    });
    return {
      id: payment.id,
      status: String(payment.status) as PaymentStatusCode,
      provider: String(payment.provider) as PaymentProviderCode,
      amountVnd: Number(payment.amount),
    };
  }

  public async listPaymentsByOrderId(
    orderId: string,
  ): Promise<ListPaymentsByOrderIdResponse> {
    const payments = await this.paymentRepository.listPaymentsByOrderId(
      orderId.trim(),
    );
    return {
      payments: payments.map((payment) => ({
        id: payment.id,
        status: String(payment.status) as PaymentStatusCode,
        provider: String(payment.provider) as PaymentProviderCode,
        amountVnd: Number(payment.amount),
      })),
    };
  }

  private parsePaymentProvider(
    raw: CreatePaymentForOrderRequest['provider'],
  ): PaymentProvider {
    if (raw === 'COD') {
      return PaymentProvider.COD;
    }
    if (raw === 'MANUAL') {
      return PaymentProvider.MANUAL;
    }
    throw new RpcException({
      status: HttpStatus.BAD_REQUEST,
      message: 'Unsupported paymentProvider; use COD or MANUAL',
    });
  }
}
