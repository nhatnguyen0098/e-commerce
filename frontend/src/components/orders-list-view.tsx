import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { fetchMyOrders, type OrderSummary } from '../api/orders-api'
import { formatVnd } from '../utils/format-vnd'

type OrdersListViewProps = {
  readonly onBack: () => void
  readonly onOpenOrder: (orderId: string) => void
}

function formatPlacedAt(iso: string): string {
  try {
    const d: Date = new Date(iso)
    return d.toLocaleString('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export function OrdersListView(props: OrdersListViewProps): ReactElement {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled: boolean = false
    void (async (): Promise<void> => {
      try {
        const list: OrderSummary[] = await fetchMyOrders()
        if (cancelled) {
          return
        }
        setLoadError(null)
        setOrders(list)
      } catch {
        if (!cancelled) {
          setLoadError('Không tải được danh sách đơn.')
        }
      }
    })()
    return (): void => {
      cancelled = true
    }
  }, [])
  return (
    <div>
      <button
        className="mb-6 rounded-full bg-sky-50 px-4 py-2 text-sm font-extrabold text-sky-800 hover:bg-sky-100"
        onClick={() => props.onBack()}
        type="button"
      >
        ← Về cửa hàng
      </button>
      <h1 className="text-2xl font-extrabold text-sky-900 sm:text-3xl">
        Đơn hàng của tôi
      </h1>
      {loadError !== null && (
        <p className="mt-4 text-sm font-semibold text-rose-600">{loadError}</p>
      )}
      {loadError === null && orders.length === 0 && (
        <p className="mt-8 rounded-3xl border border-dashed border-sky-200 bg-white/80 px-6 py-12 text-center font-medium text-stone-500">
          Chưa có đơn nào.
        </p>
      )}
      {orders.length > 0 && (
        <ul className="mt-6 space-y-3">
          {orders.map((order: OrderSummary) => (
            <li key={order.id}>
              <button
                className="flex w-full flex-col gap-1 rounded-3xl border border-sky-100 bg-white p-4 text-left shadow-sm transition hover:border-sky-200 sm:flex-row sm:items-center sm:justify-between"
                onClick={() => props.onOpenOrder(order.id)}
                type="button"
              >
                <div>
                  <p className="font-extrabold text-stone-800">
                    Đơn{' '}
                    <span className="font-mono text-sm text-sky-700">
                      {order.id.slice(0, 8)}…
                    </span>
                  </p>
                  <p className="text-xs font-medium text-stone-500">
                    {formatPlacedAt(order.placedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-800">
                    {order.status}
                  </span>
                  <span className="text-lg font-extrabold text-sky-600">
                    {formatVnd(order.totalVnd)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
