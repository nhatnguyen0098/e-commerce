export type CreateOrderShippingAddressInput = {
  readonly recipientName: string;
  readonly phone: string;
  readonly line1: string;
  readonly line2?: string;
  readonly ward: string;
  readonly district: string;
  readonly city: string;
  readonly postalCode?: string;
  readonly contactEmail?: string;
};

export type CreateOrderCheckoutItemInput = {
  readonly productId: string;
  readonly quantity: number;
};

export type OrderCheckoutPaymentProvider = 'COD' | 'MANUAL';
export type OrderStatusCode =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type CreateOrderCheckoutBody = {
  readonly items: readonly CreateOrderCheckoutItemInput[];
  readonly shippingAddress: CreateOrderShippingAddressInput;
  readonly paymentProvider: OrderCheckoutPaymentProvider;
  readonly notes?: string;
};

export type OrderCheckoutPaymentDto = {
  readonly id: string;
  readonly status: string;
  readonly provider: string;
  readonly amountVnd: number;
};

export type OrderCheckoutResponseDto = {
  readonly orderId: string;
  readonly status: OrderStatusCode;
  readonly totalVnd: number;
  readonly currency: string;
  readonly payment: OrderCheckoutPaymentDto;
};

export type OrderSummaryDto = {
  readonly id: string;
  readonly status: OrderStatusCode;
  readonly totalVnd: number;
  readonly currency: string;
  readonly placedAt: string;
};

export type OrderLineItemDto = {
  readonly productName: string;
  readonly sku: string;
  readonly quantity: number;
  readonly unitPriceVnd: number;
  readonly lineTotalVnd: number;
};

export type OrderDetailDto = {
  readonly id: string;
  readonly status: OrderStatusCode;
  readonly currency: string;
  readonly subtotalVnd: number;
  readonly taxAmountVnd: number;
  readonly shippingAmountVnd: number;
  readonly discountAmountVnd: number;
  readonly totalVnd: number;
  readonly notes: string | null;
  readonly placedAt: string;
  readonly shippingAddressSnapshot: unknown;
  readonly items: readonly OrderLineItemDto[];
  readonly payments: readonly OrderCheckoutPaymentDto[];
};

export type CreateOrderCheckoutRpcRequest = {
  readonly accessToken: string;
  readonly body: CreateOrderCheckoutBody;
};

export type ListMyOrdersRpcRequest = {
  readonly accessToken: string;
};

export type GetMyOrderRpcRequest = {
  readonly accessToken: string;
  readonly orderId: string;
};

export const ORDERS_MESSAGE_PATTERN = {
  adminTest: 'orders-admin-test',
  checkout: 'orders-checkout',
  listMine: 'orders-list-mine',
  getMineById: 'orders-get-mine-by-id',
} as const;
