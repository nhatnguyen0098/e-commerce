import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma-order/client';
import { getOrderPrismaClient } from './order-prisma-client';

type ResolvedCheckoutLine = {
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly lineTotal: number;
};

type CreateCheckoutOrderInput = {
  readonly userId: string;
  readonly shippingAddressId: string;
  readonly shippingAddressSnapshot: Prisma.InputJsonValue;
  readonly orderStatus: OrderStatus;
  readonly total: number;
  readonly notes: string | null;
  readonly lines: readonly ResolvedCheckoutLine[];
  readonly currency: string;
};

type OrderCheckoutPersistenceResult = {
  readonly orderId: string;
  readonly status: OrderStatus;
  readonly totalVnd: number;
  readonly currency: string;
};

@Injectable()
export class OrderRepository {
  public async createCheckoutOrder(
    input: CreateCheckoutOrderInput,
  ): Promise<OrderCheckoutPersistenceResult> {
    const prisma = getOrderPrismaClient();
    const order = await prisma.order.create({
      data: {
        userId: input.userId,
        shippingAddressId: input.shippingAddressId,
        shippingAddressSnapshot: input.shippingAddressSnapshot,
        status: input.orderStatus,
        currency: input.currency,
        subtotal: new Prisma.Decimal(input.total),
        taxAmount: new Prisma.Decimal(0),
        shippingAmount: new Prisma.Decimal(0),
        discountAmount: new Prisma.Decimal(0),
        total: new Prisma.Decimal(input.total),
        notes: input.notes,
        items: {
          create: input.lines.map(
            (line): Prisma.OrderItemCreateWithoutOrderInput => ({
              productId: line.productId,
              productName: line.productName,
              sku: line.sku,
              unitPrice: new Prisma.Decimal(line.unitPrice),
              quantity: line.quantity,
              lineTotal: new Prisma.Decimal(line.lineTotal),
            }),
          ),
        },
      },
    });
    return {
      orderId: order.id,
      status: order.status,
      totalVnd: input.total,
      currency: order.currency,
    };
  }
  public async updateOrderStatus(input: {
    readonly orderId: string;
    readonly status: OrderStatus;
  }): Promise<OrderStatus> {
    const prisma = getOrderPrismaClient();
    const updatedOrder = await prisma.order.update({
      where: { id: input.orderId },
      data: { status: input.status },
      select: { status: true },
    });
    return updatedOrder.status;
  }
  public async listOrdersByUserId(userId: string): Promise<OrderSummaryRow[]> {
    const prisma = getOrderPrismaClient();
    return prisma.order.findMany({
      where: { userId },
      orderBy: { placedAt: 'desc' },
      select: {
        id: true,
        status: true,
        total: true,
        currency: true,
        placedAt: true,
      },
    });
  }
  public async findOrderDetailByUserId(input: {
    readonly userId: string;
    readonly orderId: string;
  }): Promise<OrderDetailRow | null> {
    const prisma = getOrderPrismaClient();
    return prisma.order.findFirst({
      where: { id: input.orderId, userId: input.userId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          select: {
            productName: true,
            sku: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
          },
        },
      },
    });
  }
}

type OrderSummaryRow = {
  readonly id: string;
  readonly status: OrderStatus;
  readonly total: Prisma.Decimal;
  readonly currency: string;
  readonly placedAt: Date;
};

type OrderDetailRow = {
  readonly id: string;
  readonly status: OrderStatus;
  readonly currency: string;
  readonly subtotal: Prisma.Decimal;
  readonly taxAmount: Prisma.Decimal;
  readonly shippingAmount: Prisma.Decimal;
  readonly discountAmount: Prisma.Decimal;
  readonly total: Prisma.Decimal;
  readonly notes: string | null;
  readonly placedAt: Date;
  readonly shippingAddressSnapshot: unknown;
  readonly items: readonly {
    readonly productName: string;
    readonly sku: string;
    readonly quantity: number;
    readonly unitPrice: Prisma.Decimal;
    readonly lineTotal: Prisma.Decimal;
  }[];
};
