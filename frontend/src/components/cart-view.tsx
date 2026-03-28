import type { ReactElement } from 'react'
import type { CartLine } from '../hooks/use-local-cart'
import { formatVnd } from '../utils/format-vnd'

type CartViewProps = {
  readonly lines: readonly CartLine[]
  readonly subtotalVnd: number
  readonly onContinueShopping: () => void
  readonly onCheckout: () => void
  readonly onSetQuantity: (productId: string, quantity: number) => void
  readonly onRemove: (productId: string) => void
}

export function CartView(props: CartViewProps): ReactElement {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-sky-900 sm:text-3xl">Giỏ hàng</h1>
      {props.lines.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-sky-200 bg-white/80 px-6 py-12 text-center font-medium text-stone-500">
          Giỏ đang trống.{' '}
          <button
            className="font-extrabold text-sky-600 underline"
            onClick={() => props.onContinueShopping()}
            type="button"
          >
            Tiếp tục mua
          </button>
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {props.lines.map((line: CartLine) => (
            <li
              className="flex flex-col gap-3 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              key={line.productId}
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-sky-50">
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  height={80}
                  src={line.imageUrl}
                  width={80}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-stone-800">{line.name}</p>
                <p className="mt-1 text-sky-600">{formatVnd(line.priceVnd)}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`qty-${line.productId}`}>
                  Số lượng
                </label>
                <input
                  className="w-16 rounded-xl border-2 border-sky-100 px-2 py-2 text-center font-bold"
                  id={`qty-${line.productId}`}
                  min={1}
                  type="number"
                  value={line.quantity}
                  onChange={(e) =>
                    props.onSetQuantity(
                      line.productId,
                      Number.parseInt(e.target.value, 10) || 0,
                    )
                  }
                />
                <button
                  className="rounded-xl px-3 py-2 text-sm font-extrabold text-rose-600 hover:bg-rose-50"
                  onClick={() => props.onRemove(line.productId)}
                  type="button"
                >
                  Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {props.lines.length > 0 && (
        <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-amber-100 bg-amber-50/50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-extrabold text-stone-800">
            Tạm tính:{' '}
            <span className="text-sky-600">{formatVnd(props.subtotalVnd)}</span>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              className="rounded-full bg-sky-500 px-6 py-3 text-sm font-extrabold text-white shadow-md"
              onClick={() => props.onCheckout()}
              type="button"
            >
              Thanh toán
            </button>
            <button
              className="rounded-full border-2 border-sky-200 bg-white px-6 py-3 text-sm font-extrabold text-sky-800 shadow-sm"
              onClick={() => props.onContinueShopping()}
              type="button"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
