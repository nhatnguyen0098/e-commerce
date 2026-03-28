import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import {
  fetchMyOrderDetail,
  type OrderDetail,
  type OrderLineItem,
  type OrderPaymentSummary,
} from '../api/orders-api'
import { formatVnd } from '../utils/format-vnd'

type OrderDetailViewProps = {
  readonly orderId: string
  readonly onBack: () => void
}

function formatAddressFromSnapshot(raw: unknown): string {
  if (typeof raw !== 'object' || raw === null) {
    return '—'
  }
  const record = raw as Record<string, unknown>
  const line1: unknown = record.line1
  const line2: unknown = record.line2
  const ward: unknown = record.ward
  const district: unknown = record.district
  const city: unknown = record.city
  const parts: string[] = []
  if (typeof line1 === 'string' && line1.trim().length > 0) {
    parts.push(line1.trim())
  }
  if (typeof line2 === 'string' && line2.trim().length > 0) {
    parts.push(line2.trim())
  }
  const locality: string[] = []
  if (typeof ward === 'string' && ward.trim().length > 0) {
    locality.push(ward.trim())
  }
  if (typeof district === 'string' && district.trim().length > 0) {
    locality.push(district.trim())
  }
  if (typeof city === 'string' && city.trim().length > 0) {
    locality.push(city.trim())
  }
  if (locality.length > 0) {
    parts.push(locality.join(', '))
  }
  return parts.length > 0 ? parts.join(' — ') : '—'
}

function recipientFromSnapshot(raw: unknown): string {
  if (typeof raw !== 'object' || raw === null) {
    return ''
  }
  const record = raw as Record<string, unknown>
  const name: unknown = record.recipientName
  const phone: unknown = record.phone
  const contactEmail: unknown = record.contactEmail
  const bits: string[] = []
  if (typeof name === 'string' && name.trim().length > 0) {
    bits.push(name.trim())
  }
  if (typeof phone === 'string' && phone.trim().length > 0) {
    bits.push(phone.trim())
  }
  if (typeof contactEmail === 'string' && contactEmail.trim().length > 0) {
    bits.push(contactEmail.trim())
  }
  return bits.join(' · ')
}

export function OrderDetailView(props: OrderDetailViewProps): ReactElement {
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled: boolean = false
    void (async (): Promise<void> => {
      try {
        const row: OrderDetail = await fetchMyOrderDetail(props.orderId)
        if (cancelled) {
          return
        }
        setLoadError(null)
        setDetail(row)
      } catch {
        if (!cancelled) {
          setLoadError('Không tải được chi tiết đơn.')
          setDetail(null)
        }
      }
    })()
    return (): void => {
      cancelled = true
    }
  }, [props.orderId])
  return (
    <div>
      <button
        className="mb-6 rounded-full bg-sky-50 px-4 py-2 text-sm font-extrabold text-sky-800 hover:bg-sky-100"
        onClick={() => props.onBack()}
        type="button"
      >
        ← Danh sách đơn
      </button>
      <h1 className="text-2xl font-extrabold text-sky-900 sm:text-3xl">
        Chi tiết đơn hàng
      </h1>
      {loadError !== null && (
        <p className="mt-4 text-sm font-semibold text-rose-600">{loadError}</p>
      )}
      {detail !== null && (
        <div className="mt-8 space-y-6">
          <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-extrabold text-stone-400">Mã đơn</p>
            <p className="mt-1 font-mono text-sm font-bold text-sky-800">
              {detail.id}
            </p>
            <p className="mt-4 text-xs font-extrabold text-stone-400">Trạng thái</p>
            <p className="mt-1 inline-block rounded-full bg-sky-50 px-3 py-1 text-sm font-extrabold text-sky-900">
              {detail.status}
            </p>
            {detail.notes !== null && detail.notes.trim().length > 0 && (
              <>
                <p className="mt-4 text-xs font-extrabold text-stone-400">Ghi chú</p>
                <p className="mt-1 text-sm font-medium text-stone-700">
                  {detail.notes}
                </p>
              </>
            )}
          </section>
          <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-sky-900">Giao hàng</h2>
            <p className="mt-2 text-sm font-semibold text-stone-800">
              {recipientFromSnapshot(detail.shippingAddressSnapshot)}
            </p>
            <p className="mt-1 text-sm text-stone-600">
              {formatAddressFromSnapshot(detail.shippingAddressSnapshot)}
            </p>
          </section>
          <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-sky-900">Thanh toán</h2>
            <ul className="mt-3 space-y-2">
              {detail.payments.map((pay: OrderPaymentSummary) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-amber-50/50 px-4 py-3"
                  key={pay.id}
                >
                  <span className="text-sm font-bold text-stone-800">
                    {pay.provider}{' '}
                    <span className="font-mono text-xs text-stone-500">
                      ({pay.status})
                    </span>
                  </span>
                  <span className="font-extrabold text-sky-700">
                    {formatVnd(pay.amountVnd)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-sky-900">Sản phẩm</h2>
            <ul className="mt-4 space-y-3">
              {detail.items.map((item: OrderLineItem, index: number) => (
                <li
                  className="flex flex-col gap-1 border-b border-sky-50 pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between"
                  key={`${item.sku}-${index}`}
                >
                  <div>
                    <p className="font-extrabold text-stone-800">{item.productName}</p>
                    <p className="text-xs text-stone-500">SKU {item.sku}</p>
                  </div>
                  <p className="text-sm font-bold text-sky-700">
                    {item.quantity} × {formatVnd(item.unitPriceVnd)} ={' '}
                    {formatVnd(item.lineTotalVnd)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-1 border-t border-sky-100 pt-4 text-sm">
              <p className="flex justify-between">
                <span>Tạm tính</span>
                <span className="font-bold">{formatVnd(detail.subtotalVnd)}</span>
              </p>
              <p className="flex justify-between">
                <span>Thuế</span>
                <span className="font-bold">{formatVnd(detail.taxAmountVnd)}</span>
              </p>
              <p className="flex justify-between">
                <span>Phí giao</span>
                <span className="font-bold">
                  {formatVnd(detail.shippingAmountVnd)}
                </span>
              </p>
              <p className="flex justify-between">
                <span>Giảm giá</span>
                <span className="font-bold">
                  {formatVnd(detail.discountAmountVnd)}
                </span>
              </p>
              <p className="flex justify-between text-lg font-extrabold text-sky-800">
                <span>Tổng</span>
                <span>{formatVnd(detail.totalVnd)}</span>
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
