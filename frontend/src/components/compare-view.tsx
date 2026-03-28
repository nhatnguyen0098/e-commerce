import { useEffect, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import {
  fetchCatalogProductBySlug,
  type CatalogProductDetail,
} from '../api/catalog-api'
import { formatVnd } from '../utils/format-vnd'
import { MAX_COMPARE_PRODUCTS } from '../hooks/use-compare-slugs'

type CompareColumn =
  | { readonly slug: string; readonly ok: true; readonly product: CatalogProductDetail }
  | { readonly slug: string; readonly ok: false }

type CompareViewProps = {
  readonly slugs: readonly string[]
  readonly onRemoveSlug: (slug: string) => void
  readonly onClearAll: () => void
  readonly onOpenProduct: (slug: string) => void
  readonly onBackToShop: () => void
}

export function CompareView(props: CompareViewProps): ReactElement {
  const [columns, setColumns] = useState<CompareColumn[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  useEffect(() => {
    if (props.slugs.length === 0) {
      setColumns([])
      setIsLoading(false)
      setLoadError(null)
      return
    }
    let cancelled: boolean = false
    setIsLoading(true)
    setLoadError(null)
    void (async (): Promise<void> => {
      try {
        const results: CompareColumn[] = await Promise.all(
          props.slugs.map(async (slug: string): Promise<CompareColumn> => {
            try {
              const product: CatalogProductDetail =
                await fetchCatalogProductBySlug(slug)
              return { slug, ok: true, product }
            } catch {
              return { slug, ok: false }
            }
          }),
        )
        const order: Map<string, number> = new Map(
          props.slugs.map((s, i) => [s, i]),
        )
        const ordered: CompareColumn[] = [...results].sort(
          (a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0),
        )
        if (!cancelled) {
          setColumns(ordered)
        }
      } catch {
        if (!cancelled) {
          setLoadError('Lỗi tải so sánh.')
          setColumns([])
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
  }, [props.slugs])
  if (props.slugs.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-sky-200 bg-white/90 px-6 py-14 text-center">
        <p className="text-lg font-extrabold text-sky-900">Chưa có sản phẩm so sánh</p>
        <p className="mx-auto mt-3 max-w-md text-sm text-stone-500">
          Chọn tối đa {MAX_COMPARE_PRODUCTS} sản phẩm từ trang chủ hoặc chi tiết.
        </p>
        <button
          className="mt-8 rounded-full bg-sky-500 px-8 py-3 text-sm font-extrabold text-white"
          onClick={() => props.onBackToShop()}
          type="button"
        >
          Xem sản phẩm
        </button>
      </div>
    )
  }
  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-sky-900 sm:text-3xl">So sánh</h1>
          <p className="mt-2 text-sm text-stone-500">
            {props.slugs.length}/{MAX_COMPARE_PRODUCTS} sản phẩm
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full border-2 border-sky-100 px-5 py-2 text-sm font-extrabold text-sky-800"
            onClick={() => props.onBackToShop()}
            type="button"
          >
            ← Tiếp tục mua
          </button>
          <button
            className="rounded-full px-5 py-2 text-sm font-extrabold text-rose-600 hover:bg-rose-50"
            onClick={() => props.onClearAll()}
            type="button"
          >
            Xóa hết
          </button>
        </div>
      </div>
      {loadError !== null && (
        <p className="mb-4 text-rose-600">{loadError}</p>
      )}
      {isLoading && <p className="py-12 text-center font-bold text-sky-600">Đang tải…</p>}
      {!isLoading && columns.length > 0 && (
        <div className="overflow-x-auto rounded-3xl border border-sky-100 bg-white shadow-lg">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50">
                <th className="sticky left-0 z-10 w-32 bg-sky-50/95 px-3 py-3 text-xs font-extrabold uppercase text-stone-400">
                  Thuộc tính
                </th>
                {columns.map((col) => (
                  <th className="min-w-[12rem] border-l border-sky-100 px-3 py-3 align-top" key={col.slug}>
                    {col.ok ? (
                      <div className="flex flex-col gap-2">
                        <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-sky-50">
                          <button
                            className="block h-full w-full"
                            onClick={() => props.onOpenProduct(col.product.slug)}
                            type="button"
                          >
                            <img
                              alt=""
                              className="h-full w-full object-cover"
                              src={col.product.images[0]?.url ?? ''}
                            />
                          </button>
                        </div>
                        <button
                          className="text-left text-sm font-extrabold text-sky-900 hover:underline"
                          onClick={() => props.onOpenProduct(col.product.slug)}
                          type="button"
                        >
                          {col.product.name}
                        </button>
                        <button
                          className="text-xs font-extrabold text-rose-500"
                          onClick={() => props.onRemoveSlug(col.slug)}
                          type="button"
                        >
                          Bỏ khỏi so sánh
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-rose-600">Lỗi tải</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow label="Hãng">
                {columns.map((col) => (
                  <td className="border-l border-t border-sky-100 px-3 py-2" key={`b-${col.slug}`}>
                    {col.ok ? col.product.brand || '—' : '—'}
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="Giá">
                {columns.map((col) => (
                  <td className="border-l border-t border-sky-100 px-3 py-2 font-extrabold text-sky-600" key={`p-${col.slug}`}>
                    {col.ok ? formatVnd(col.product.priceVnd) : '—'}
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="SKU">
                {columns.map((col) => (
                  <td className="border-l border-t border-sky-100 px-3 py-2 font-mono text-xs" key={`s-${col.slug}`}>
                    {col.ok ? col.product.sku : '—'}
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="Mô tả">
                {columns.map((col) => (
                  <td className="border-l border-t border-sky-100 px-3 py-2 align-top text-xs text-stone-600" key={`d-${col.slug}`}>
                    {col.ok ? (
                      <span className="line-clamp-5 whitespace-pre-wrap">{col.product.description}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                ))}
              </CompareRow>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CompareRow(props: { readonly label: string; readonly children: ReactNode }): ReactElement {
  return (
    <tr>
      <th className="sticky left-0 z-10 bg-white/95 px-3 py-2 text-left text-xs font-extrabold uppercase text-stone-400">
        {props.label}
      </th>
      {props.children}
    </tr>
  )
}
