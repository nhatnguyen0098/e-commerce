import { Injectable } from '@nestjs/common';
import { PaymentProvider, PaymentStatus, Prisma } from '@prisma-payment/client';
import { getPaymentPrismaClient } from './payment-prisma-client';

@Injectable()
export class PaymentRepository {
  public async createPaymentForOrder(input: {
    readonly orderId: string;
    readonly amountVnd: number;
    readonly provider: PaymentProvider;
    readonly status: PaymentStatus;
    readonly currency: string;
  }): Promise<PaymentForOrderRow> {
    const prisma = getPaymentPrismaClient();
    return prisma.payment.create({
      data: {
        orderId: input.orderId,
        provider: input.provider,
        status: input.status,
        amount: new Prisma.Decimal(input.amountVnd),
        currency: input.currency,
        paidAt: input.status === PaymentStatus.COMPLETED ? new Date() : null,
      },
      select: { id: true, status: true, provider: true, amount: true },
    });
  }
  public async listPaymentsByOrderId(
    orderId: string,
  ): Promise<PaymentForOrderRow[]> {
    const prisma = getPaymentPrismaClient();
    return prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, status: true, provider: true, amount: true },
    });
  }
}

type PaymentForOrderRow = {
  readonly id: string;
  readonly status: PaymentStatus;
  readonly provider: PaymentProvider;
  readonly amount: Prisma.Decimal;
};
