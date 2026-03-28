export type CatalogCategoryDto = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
};

export type CatalogProductDto = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly brand: string;
  readonly priceVnd: number;
  readonly shortDescription: string;
  readonly imageUrl: string;
  readonly categorySlug: string | null;
  readonly categoryName: string | null;
};

export type CatalogProductImageDto = {
  readonly url: string;
  readonly altText: string;
};

export type CatalogProductDetailDto = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly brand: string;
  readonly sku: string;
  readonly priceVnd: number;
  readonly description: string;
  readonly images: CatalogProductImageDto[];
  readonly categorySlug: string | null;
  readonly categoryName: string | null;
  readonly stockQuantity: number;
};

export type CatalogListProductsRequest = {
  readonly search?: string;
  readonly categorySlug?: string;
  readonly brand?: string;
  /** Opaque cursor from the previous response; omit for the first page. */
  readonly cursor?: string;
  readonly limit: number;
};

export type CatalogListProductsResponse = {
  readonly items: CatalogProductDto[];
  readonly total: number;
  readonly limit: number;
  /** Present when more items exist after this page. */
  readonly nextCursor: string | null;
};

export type CatalogGetProductBySlugRequest = {
  readonly slug: string;
};

export type CatalogValidateCheckoutLineInput = {
  readonly productId: string;
  readonly quantity: number;
};

export type CatalogValidatedCheckoutLine = {
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly lineTotal: number;
};

export type CatalogValidateCheckoutLinesRequest = {
  readonly items: readonly CatalogValidateCheckoutLineInput[];
};

export type CatalogValidateCheckoutLinesResponse = {
  readonly lines: readonly CatalogValidatedCheckoutLine[];
};

export const CATALOG_MESSAGE_PATTERN = {
  listCategories: 'catalog-list-categories',
  listBrands: 'catalog-list-brands',
  listProducts: 'catalog-list-products',
  getProductBySlug: 'catalog-get-product-by-slug',
  validateCheckoutLines: 'catalog-validate-checkout-lines',
} as const;
