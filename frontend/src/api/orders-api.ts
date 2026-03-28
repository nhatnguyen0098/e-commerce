const apiBaseUrl: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export type PaymentProviderApi = 'COD' | 'MANUAL'

export type OrderCheckoutShippingAddress = {
  readonly recipientName: string
  readonly phone: string
  readonly line1: string
  readonly line2?: string
  readonly ward: string
  readonly district: string
  readonly city: string
  readonly postalCode?: string
  readonly contactEmail?: string
}

export type OrderPaymentSummary = {
  readonly id: string
  readonly status: string
  readonly provider: string
  readonly amountVnd: number
}

export type OrderCheckoutResponse = {
  readonly orderId: string
  readonly status: string
  readonly totalVnd: number
  readonly currency: string
  readonly payment: OrderPaymentSummary
}

export type OrderSummary = {
  readonly id: string
  readonly status: string
  readonly totalVnd: number
  readonly currency: string
  readonly placedAt: string
}

export type OrderLineItem = {
  readonly productName: string
  readonly sku: string
  readonly quantity: number
  readonly unitPriceVnd: number
  readonly lineTotalVnd: number
}

export type OrderDetail = {
  readonly id: string
  readonly status: string
  readonly currency: string
  readonly subtotalVnd: number
  readonly taxAmountVnd: number
  readonly shippingAmountVnd: number
  readonly discountAmountVnd: number
  readonly totalVnd: number
  readonly notes: string | null
  readonly placedAt: string
  readonly shippingAddressSnapshot: unknown
  readonly items: readonly OrderLineItem[]
  readonly payments: readonly OrderPaymentSummary[]
}

async function parseJsonOrThrow(response: Response): Promise<unknown> {
  const text: string = await response.text()
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error('Invalid JSON from server')
  }
}

function messageFromErrorPayload(payload: unknown, fallback: string): string {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('message' in payload)
  ) {
    return fallback
  }
  const raw: unknown = (payload as { message: unknown }).message
  if (typeof raw === 'string') {
    return raw
  }
  if (Array.isArray(raw) && raw.every((item) => typeof item === 'string')) {
    return raw.join(', ')
  }
  return fallback
}

export async function createOrderCheckout(input: {
  readonly items: readonly { readonly productId: string; readonly quantity: number }[]
  readonly shippingAddress: OrderCheckoutShippingAddress
  readonly paymentProvider: PaymentProviderApi
  readonly notes?: string
}): Promise<OrderCheckoutResponse> {
  const response: Response = await fetch(`${apiBaseUrl}/orders/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      items: input.items,
      shippingAddress: input.shippingAddress,
      paymentProvider: input.paymentProvider,
      notes: input.notes,
    }),
  })
  const payload: unknown = await parseJsonOrThrow(response)
  if (!response.ok) {
    throw new Error(
      messageFromErrorPayload(payload, `Checkout failed (${response.status})`),
    )
  }
  return payload as OrderCheckoutResponse
}

export async function fetchMyOrders(): Promise<OrderSummary[]> {
  const response: Response = await fetch(`${apiBaseUrl}/orders/mine`, {
    method: 'GET',
    credentials: 'include',
  })
  const payload: unknown = await parseJsonOrThrow(response)
  if (!response.ok) {
    throw new Error(
      messageFromErrorPayload(payload, `Could not load orders (${response.status})`),
    )
  }
  return payload as OrderSummary[]
}

export async function fetchMyOrderDetail(orderId: string): Promise<OrderDetail> {
  const response: Response = await fetch(
    `${apiBaseUrl}/orders/mine/${encodeURIComponent(orderId)}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  )
  const payload: unknown = await parseJsonOrThrow(response)
  if (!response.ok) {
    throw new Error(
      messageFromErrorPayload(payload, `Could not load order (${response.status})`),
    )
  }
  return payload as OrderDetail
}
