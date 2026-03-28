const apiBaseUrl: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export type CatalogCategory = {
  readonly id: string
  readonly name: string
  readonly slug: string
}

export type CatalogProduct = {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly brand: string
  readonly priceVnd: number
  readonly shortDescription: string
  readonly imageUrl: string
  readonly categorySlug: string | null
  readonly categoryName: string | null
}

export type CatalogProductImage = {
  readonly url: string
  readonly altText: string
}

export type CatalogProductDetail = {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly brand: string
  readonly sku: string
  readonly priceVnd: number
  readonly description: string
  readonly images: readonly CatalogProductImage[]
  readonly categorySlug: string | null
  readonly categoryName: string | null
  readonly stockQuantity: number
}

export type CatalogProductsResponse = {
  readonly items: readonly CatalogProduct[]
  readonly total: number
  readonly limit: number
  readonly nextCursor: string | null
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

export async function fetchCatalogCategories(): Promise<CatalogCategory[]> {
  const response: Response = await fetch(`${apiBaseUrl}/catalog/categories`, {
    credentials: 'omit',
  })
  const payload: unknown = await parseJsonOrThrow(response)
  if (!response.ok) {
    throw new Error('Could not load categories')
  }
  return payload as CatalogCategory[]
}

export async function fetchCatalogBrands(): Promise<string[]> {
  const response: Response = await fetch(`${apiBaseUrl}/catalog/brands`, {
    credentials: 'omit',
  })
  const payload: unknown = await parseJsonOrThrow(response)
  if (!response.ok) {
    throw new Error('Could not load brands')
  }
  return payload as string[]
}

export async function fetchCatalogProducts(input: {
  readonly q?: string
  readonly categorySlug?: string
  readonly brand?: string
  readonly cursor?: string
  readonly limit?: number
}): Promise<CatalogProductsResponse> {
  const params: URLSearchParams = new URLSearchParams()
  if (input.q !== undefined && input.q.trim().length > 0) {
    params.set('q', input.q.trim())
  }
  if (input.categorySlug !== undefined && input.categorySlug.length > 0) {
    params.set('category', input.categorySlug)
  }
  if (input.brand !== undefined && input.brand.length > 0) {
    params.set('brand', input.brand)
  }
  if (input.cursor !== undefined && input.cursor.trim().length > 0) {
    params.set('cursor', input.cursor.trim())
  }
  params.set('limit', String(input.limit ?? 48))
  const response: Response = await fetch(
    `${apiBaseUrl}/catalog/products?${params.toString()}`,
    { credentials: 'omit' },
  )
  const payload: unknown = await parseJsonOrThrow(response)
  if (!response.ok) {
    throw new Error('Could not load products')
  }
  return payload as CatalogProductsResponse
}

export async function fetchCatalogProductBySlug(
  slug: string,
): Promise<CatalogProductDetail> {
  const encoded: string = encodeURIComponent(slug.trim())
  const response: Response = await fetch(
    `${apiBaseUrl}/catalog/products/${encoded}`,
    { credentials: 'omit' },
  )
  const payload: unknown = await parseJsonOrThrow(response)
  if (response.status === 404) {
    throw new Error('Không tìm thấy sản phẩm')
  }
  if (!response.ok) {
    throw new Error('Could not load product')
  }
  return payload as CatalogProductDetail
}
