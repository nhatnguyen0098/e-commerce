import { PaymentProvider, PaymentStatus } from '@prisma-payment/client';

export type PaymentMethodState = {
  readonly paymentStatus: PaymentStatus;
};

export interface PaymentMethodStrategy {
  supports(provider: PaymentProvider): boolean;
  buildState(): PaymentMethodState;
}
