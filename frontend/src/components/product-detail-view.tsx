import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import {
  fetchCatalogProductBySlug,
  type CatalogProductDetail,
} from '../api/catalog-api'
import { MAX_COMPARE_PRODUCTS } from '../hooks/use-compare-slugs'
import { formatVnd } from '../utils/format-vnd'

type ProductDetailViewProps = {
  readonly slug: string
  readonly onBack: () => void
  readonly onAddToCart: (product: CatalogProductDetail) => void
  readonly isInCompare: boolean
  readonly canAddMoreToCompare: boolean
  readonly onToggleCompare: () => void
}

export function ProductDetailView(props: ProductDetailViewProps): ReactElement {
  const [product, setProduct] = useState<CatalogProductDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [imageIndex, setImageIndex] = useState<number>(0)
  useEffect(() => {
    setImageIndex(0)
    let cancelled: boolean = false
    setIsLoading(true)
    setLoadError(null)
    setProduct(null)
    void (async (): Promise<void> => {
      try {
        const loaded: CatalogProductDetail = await fetchCatalogProductBySlug(
          props.slug,
        )
        if (!cancelled) {
          setProduct(loaded)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Không tải được sản phẩm',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()
    return (): void => {
      cancelled = true
    }
  }, [props.slug])
  const primaryUrl: string | undefined =
    product !== null && product.images.length > 0
      ? product.images[imageIndex]?.url
      : undefined
  return (
    <div>
      <button
        className="mb-6 rounded-full bg-sky-50 px-4 py-2 text-sm font-extrabold text-sky-800 hover:bg-sky-100"
        onClick={() => props.onBack()}
        type="button"
      >
        ← Quay lại
      </button>
      {isLoading && (
        <p className="rounded-3xl border border-sky-100 py-12 text-center font-bold text-sky-600">
          Đang tải…
        </p>
      )}
      {!isLoading && loadError !== null && (
        <div className="rounded-3xl border border-rose-100 bg-rose-50/90 px-6 py-8 text-center">
          <p className="font-bold text-rose-700">{loadError}</p>
          <button
            className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-extrabold text-sky-700 ring-1 ring-sky-100"
            onClick={() => props.onBack()}
            type="button"
          >
            Về trang chủ
          </button>
        </div>
      )}
      {!isLoading && product !== null && (
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-b from-sky-50 to-amber-50/40">
              {primaryUrl !== undefined && (
                <img
                  alt={product.images[imageIndex]?.altText ?? product.name}
                  className="h-full w-full object-cover"
                  src={primaryUrl}
                />
              )}
            </div>
            {product.images.length > 1 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.images.map((img, i) => (
                  <li key={`${img.url}-${i}`}>
                    <button
                      className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${
                        i === imageIndex ? 'border-sky-400' : 'border-sky-100'
                      }`}
                      onClick={() => setImageIndex(i)}
                      type="button"
                    >
                      <img alt="" className="h-full w-full object-cover" src={img.url} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-sky-900 sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-4 text-3xl font-extrabold text-sky-600">
              {formatVnd(product.priceVnd)}
            </p>
            <p className="mt-4 text-sm text-stone-600">
              SKU: <span className="font-mono font-semibold">{product.sku}</span> · Tồn:{' '}
              {product.stockQuantity}
            </p>
            <p className="mt-6 whitespace-pre-wrap text-stone-600">{product.description}</p>
            <button
              className={`mt-6 w-full rounded-2xl border-2 py-3 text-sm font-extrabold disabled:opacity-45 ${
                props.isInCompare
                  ? 'border-violet-300 bg-violet-50 text-violet-900'
                  : 'border-sky-100 bg-white text-sky-800'
              }`}
              disabled={!props.isInCompare && !props.canAddMoreToCompare}
              onClick={() => props.onToggleCompare()}
              title={
                !props.isInCompare && !props.canAddMoreToCompare
                  ? `Tối đa ${MAX_COMPARE_PRODUCTS}`
                  : undefined
              }
              type="button"
            >
              {props.isInCompare ? '✓ Trong danh sách so sánh' : 'Thêm vào so sánh'}
            </button>
            <button
              className="mt-3 w-full rounded-2xl bg-gradient-to-r from-amber-300 to-amber-400 py-3.5 text-sm font-extrabold text-amber-950 disabled:opacity-50"
              disabled={product.stockQuantity <= 0}
              onClick={() => props.onAddToCart(product)}
              type="button"
            >
              {product.stockQuantity > 0 ? 'Thêm vào giỏ ✨' : 'Hết hàng'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
