export type CreatePaymentForOrderRequest = {
  readonly orderId: string;
  readonly userId: string;
  readonly amountVnd: number;
  readonly provider: 'COD' | 'MANUAL';
};

export type PaymentStatusCode =
  | 'PENDING'
  | 'REQUIRES_ACTION'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentProviderCode = 'STRIPE' | 'PAYPAL' | 'MANUAL' | 'COD';

export type PaymentForOrderDto = {
  readonly id: string;
  readonly status: PaymentStatusCode;
  readonly provider: PaymentProviderCode;
  readonly amountVnd: number;
};

export type ListPaymentsByOrderIdRequest = {
  readonly orderId: string;
};

export type ListPaymentsByOrderIdResponse = {
  readonly payments: readonly PaymentForOrderDto[];
};

export const PAYMENTS_MESSAGE_PATTERN = {
  createForOrder: 'payments-create-for-order',
  listByOrderId: 'payments-list-by-order-id',
} as const;
