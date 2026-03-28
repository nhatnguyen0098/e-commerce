import { Injectable } from '@nestjs/common';
import { PaymentProvider, PaymentStatus } from '@prisma-payment/client';
import {
  PaymentMethodState,
  PaymentMethodStrategy,
} from './payment-method-strategy.interface';

@Injectable()
export class CodPaymentMethodStrategy implements PaymentMethodStrategy {
  public supports(provider: PaymentProvider): boolean {
    return provider === PaymentProvider.COD;
  }
  public buildState(): PaymentMethodState {
    return {
      paymentStatus: PaymentStatus.COMPLETED,
    };
  }
}
