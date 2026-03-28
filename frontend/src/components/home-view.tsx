import type { ReactElement } from 'react'
import type { CatalogCategory, CatalogProduct } from '../api/catalog-api'
import { MAX_COMPARE_PRODUCTS } from '../hooks/use-compare-slugs'
import { formatVnd } from '../utils/format-vnd'

type HomeViewProps = {
  readonly products: readonly CatalogProduct[]
  readonly categories: readonly CatalogCategory[]
  readonly brands: readonly string[]
  readonly total: number
  readonly hasMore: boolean
  readonly loadMorePending: boolean
  readonly isLoading: boolean
  readonly loadError: string | null
  readonly searchInput: string
  readonly categorySlug: string
  readonly brand: string
  readonly onSearchInputChange: (value: string) => void
  readonly onCategoryChange: (slug: string) => void
  readonly onBrandChange: (value: string) => void
  readonly onLoadMore: () => void
  readonly onAddToCart: (product: CatalogProduct) => void
  readonly onOpenProduct: (product: CatalogProduct) => void
  readonly isProductInCompare: (slug: string) => boolean
  readonly canAddMoreToCompare: boolean
  readonly onToggleCompareProduct: (product: CatalogProduct) => void
}

export function HomeView(props: HomeViewProps): ReactElement {
  return (
    <div>
      <div className="mb-8 text-center sm:mb-10 sm:text-left">
        <p className="mb-2 inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-bold text-amber-800">
          Cho bé yêu từ 0 tháng
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight text-sky-900 sm:text-4xl">
          Sữa lon &amp; sữa bột
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-stone-500 sm:mx-0">
          Tìm theo tên, lọc theo danh mục và hãng.
        </p>
      </div>
      <div className="mb-8 rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-md sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block sm:col-span-2 lg:col-span-2">
            <span className="text-xs font-extrabold uppercase tracking-wide text-stone-400">
              Tìm kiếm
            </span>
            <input
              className="mt-1 w-full rounded-2xl border-2 border-sky-100 bg-sky-50/40 px-4 py-3 outline-none focus:border-sky-300"
              placeholder="Tên, mô tả, hãng…"
              type="search"
              value={props.searchInput}
              onChange={(e) => props.onSearchInputChange(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-stone-400">
              Danh mục
            </span>
            <select
              className="mt-1 w-full rounded-2xl border-2 border-sky-100 bg-sky-50/40 px-4 py-3 font-medium outline-none focus:border-sky-300"
              value={props.categorySlug}
              onChange={(e) => props.onCategoryChange(e.target.value)}
            >
              <option value="">Tất cả</option>
              {props.categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-stone-400">
              Hãng
            </span>
            <select
              className="mt-1 w-full rounded-2xl border-2 border-sky-100 bg-sky-50/40 px-4 py-3 font-medium outline-none focus:border-sky-300"
              value={props.brand}
              onChange={(e) => props.onBrandChange(e.target.value)}
            >
              <option value="">Tất cả</option>
              {props.brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 text-sm font-semibold text-stone-500">
          {props.loadError ? (
            <p className="text-rose-600">{props.loadError}</p>
          ) : props.isLoading ? (
            <p className="text-sky-600">Đang tải…</p>
          ) : (
            <p>
              {props.total === 0 ? 'Không có sản phẩm' : `${props.total} sản phẩm`}
            </p>
          )}
        </div>
      </div>
      {!props.isLoading && props.products.length === 0 && !props.loadError && (
        <p className="rounded-3xl border border-dashed border-amber-200 bg-amber-50/60 px-6 py-10 text-center text-stone-600">
          Chạy <code className="rounded bg-white px-1">npm run prisma:seed</code> trong backend.
        </p>
      )}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {props.products.map((product) => (
          <li key={product.id}>
            <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-sky-100/80 bg-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
              <button
                className="block w-full cursor-pointer text-left"
                onClick={() => props.onOpenProduct(product)}
                type="button"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gradient-to-b from-sky-50 to-amber-50/40">
                  <img
                    alt=""
                    className="h-full w-full object-cover transition group-hover:scale-[1.04]"
                    src={product.imageUrl}
                  />
                </div>
              </button>
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {product.brand.trim().length > 0 && (
                    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-extrabold text-sky-800">
                      {product.brand}
                    </span>
                  )}
                  {product.categoryName && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-900">
                      {product.categoryName}
                    </span>
                  )}
                </div>
                <button
                  className="block w-full text-left"
                  onClick={() => props.onOpenProduct(product)}
                  type="button"
                >
                  <h3 className="text-lg font-extrabold text-stone-800">{product.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-stone-500">
                    {product.shortDescription}
                  </p>
                  <p className="mt-4 text-xl font-extrabold text-sky-600">
                    {formatVnd(product.priceVnd)}
                  </p>
                </button>
                <button
                  className={`mt-3 w-full rounded-2xl border-2 py-2.5 text-sm font-extrabold transition disabled:opacity-45 ${
                    props.isProductInCompare(product.slug)
                      ? 'border-violet-300 bg-violet-50 text-violet-900'
                      : 'border-sky-100 bg-white text-sky-800 hover:bg-sky-50/80'
                  }`}
                  disabled={
                    !props.isProductInCompare(product.slug) &&
                    !props.canAddMoreToCompare
                  }
                  onClick={() => props.onToggleCompareProduct(product)}
                  title={
                    !props.isProductInCompare(product.slug) &&
                    !props.canAddMoreToCompare
                      ? `Tối đa ${MAX_COMPARE_PRODUCTS} sản phẩm`
                      : undefined
                  }
                  type="button"
                >
                  {props.isProductInCompare(product.slug) ? '✓ Đang so sánh' : 'Thêm so sánh'}
                </button>
                <button
                  className="mt-2 w-full rounded-2xl bg-gradient-to-r from-amber-300 to-amber-400 py-3 text-sm font-extrabold text-amber-950 shadow-sm"
                  onClick={() => props.onAddToCart(product)}
                  type="button"
                >
                  Thêm vào giỏ ✨
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>
      {props.hasMore && props.products.length > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            className="rounded-full border-2 border-sky-200 bg-white px-8 py-3 text-sm font-extrabold text-sky-800 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={props.loadMorePending}
            onClick={() => props.onLoadMore()}
            type="button"
          >
            {props.loadMorePending ? 'Đang tải…' : 'Xem thêm'}
          </button>
        </div>
      )}
    </div>
  )
}
