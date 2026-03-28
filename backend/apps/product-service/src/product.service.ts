import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import type { Prisma, Product } from '@prisma-product/client';
import type {
  CatalogCategoryDto,
  CatalogValidateCheckoutLineInput,
  CatalogValidatedCheckoutLine,
  CatalogValidateCheckoutLinesResponse,
  CatalogListProductsRequest,
  CatalogListProductsResponse,
  CatalogProductDetailDto,
  CatalogProductDto,
  CatalogProductImageDto,
} from '@contracts/catalog/catalog.contracts';
import { getNumberConfig } from '@common/configs/get-number-config';
import { RedisService } from '@common/redis/redis.service';
import { catalogListCursorCodec } from '@common/utils/catalog-list-cursor.codec';
import { createHash } from 'node:crypto';
import { ProductRepository } from './product.repository';

const PLACEHOLDER_IMAGE: string =
  'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=60';

const LIST_CACHE_PREFIX: string = 'ecom:catalog:list:v2:';
const DETAIL_CACHE_PREFIX: string = 'ecom:catalog:detail:v1:';

/** Matches `include: { category: { select: { slug, name } } }` (client does not export `Prisma.ProductGetPayload`). */
type ProductRow = Product & {
  readonly category: { readonly slug: string; readonly name: string } | null;
};

@Injectable()
export class ProductService {
  private readonly catalogCacheTtlSeconds: number;

  public constructor(
    private readonly redis: RedisService,
    private readonly productRepository: ProductRepository,
  ) {
    const configured: number = getNumberConfig({
      configKey: 'CATALOG_CACHE_TTL_SECONDS',
      defaultValue: 90,
    });
    const floored: number = Math.floor(configured);
    this.catalogCacheTtlSeconds =
      Number.isFinite(floored) && floored > 0 ? Math.min(floored, 86_400) : 90;
  }

  public async listCategories(): Promise<CatalogCategoryDto[]> {
    return this.productRepository.listCategories() as Promise<
      CatalogCategoryDto[]
    >;
  }

  public async listBrands(): Promise<string[]> {
    const rows: readonly { readonly brand: string }[] =
      await this.productRepository.listBrands();
    return rows.map((r: { brand: string }) => r.brand);
  }

  public async listProducts(
    input: CatalogListProductsRequest,
  ): Promise<CatalogListProductsResponse> {
    const cacheKey: string = this.buildListProductsCacheKey(input);
    const cached: CatalogListProductsResponse | undefined =
      await this.redis.getJson<CatalogListProductsResponse>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    const fresh: CatalogListProductsResponse =
      await this.loadListProductsFromDatabase(input);
    await this.redis.setJson(cacheKey, fresh, this.catalogCacheTtlSeconds);
    return fresh;
  }

  public async getProductBySlug(
    slug: string,
  ): Promise<CatalogProductDetailDto | null> {
    const trimmed: string = slug.trim();
    if (trimmed.length === 0) {
      return null;
    }
    const cacheKey: string = this.buildProductDetailCacheKey(trimmed);
    const cached: CatalogProductDetailDto | null | undefined =
      await this.redis.getJson<CatalogProductDetailDto | null>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    const fresh: CatalogProductDetailDto | null =
      await this.loadProductDetailBySlugFromDatabase(trimmed);
    await this.redis.setJson(cacheKey, fresh, this.catalogCacheTtlSeconds);
    return fresh;
  }

  public async validateCheckoutLines(
    items: readonly CatalogValidateCheckoutLineInput[],
  ): Promise<CatalogValidateCheckoutLinesResponse> {
    const normalizedItems: CatalogValidateCheckoutLineInput[] = [];
    for (const item of items) {
      const productId: string = item.productId.trim();
      const quantity: number = Math.floor(Number(item.quantity));
      if (
        productId.length === 0 ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        continue;
      }
      normalizedItems.push({ productId, quantity });
    }
    if (normalizedItems.length === 0) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Cart is empty',
      });
    }
    const ids: string[] = [];
    for (const item of normalizedItems) {
      ids.push(item.productId);
    }
    const rows: ProductRow[] =
      await this.productRepository.findActiveProductsByIds(ids);
    const productById: Map<string, ProductRow> = new Map(
      rows.map((row: ProductRow) => [row.id, row]),
    );
    const lines: CatalogValidatedCheckoutLine[] = [];
    for (const item of normalizedItems) {
      const product: ProductRow | undefined = productById.get(item.productId);
      if (product === undefined) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Invalid product: ${item.productId}`,
        });
      }
      if (product.stockQuantity < item.quantity) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Insufficient stock: ${product.name}`,
        });
      }
      const unitPrice: number = Number(product.price);
      lines.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
      });
    }
    return { lines };
  }

  private buildListProductsCacheKey(input: CatalogListProductsRequest): string {
    const payload: string = JSON.stringify({
      cursor: input.cursor ?? '',
      limit: input.limit,
      search: input.search ?? '',
      categorySlug: input.categorySlug ?? '',
      brand: input.brand ?? '',
    });
    const hash: string = createHash('sha256').update(payload).digest('hex');
    return `${LIST_CACHE_PREFIX}${hash}`;
  }

  private buildProductDetailCacheKey(trimmedSlug: string): string {
    return `${DETAIL_CACHE_PREFIX}${trimmedSlug}`;
  }

  private async loadListProductsFromDatabase(
    input: CatalogListProductsRequest,
  ): Promise<CatalogListProductsResponse> {
    const whereBase: Prisma.ProductWhereInput = this.buildProductWhere(input);
    const cursorParts =
      input.cursor !== undefined && input.cursor.trim().length > 0
        ? catalogListCursorCodec.decode(input.cursor.trim())
        : null;
    if (
      input.cursor !== undefined &&
      input.cursor.trim().length > 0 &&
      cursorParts === null
    ) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid cursor',
      });
    }
    const where: Prisma.ProductWhereInput =
      cursorParts !== null
        ? {
            AND: [
              whereBase,
              {
                OR: [
                  { name: { gt: cursorParts.name } },
                  {
                    AND: [
                      { name: { equals: cursorParts.name } },
                      { id: { gt: cursorParts.id } },
                    ],
                  },
                ],
              },
            ],
          }
        : whereBase;
    const take: number = input.limit + 1;
    const [total, rows]: [number, ProductRow[]] = await Promise.all([
      this.productRepository.countProducts(whereBase),
      this.productRepository.findProducts({ where, take }),
    ]);
    const hasMore: boolean = rows.length > input.limit;
    const pageRows: ProductRow[] = hasMore ? rows.slice(0, input.limit) : rows;
    const lastRow: ProductRow | undefined =
      pageRows.length > 0 ? pageRows[pageRows.length - 1] : undefined;
    const nextCursor: string | null =
      hasMore && lastRow !== undefined
        ? catalogListCursorCodec.encode({
            name: lastRow.name,
            id: lastRow.id,
          })
        : null;
    return {
      total,
      limit: input.limit,
      nextCursor,
      items: pageRows.map((row: ProductRow) => this.mapProduct(row)),
    };
  }

  private async loadProductDetailBySlugFromDatabase(
    trimmedSlug: string,
  ): Promise<CatalogProductDetailDto | null> {
    const row: ProductRow | null =
      await this.productRepository.findActiveProductBySlug(trimmedSlug);
    if (row === null) {
      return null;
    }
    return this.mapProductDetail(row);
  }

  private buildProductWhere(input: {
    readonly search?: string;
    readonly categorySlug?: string;
    readonly brand?: string;
  }): Prisma.ProductWhereInput {
    const andParts: Prisma.ProductWhereInput[] = [];
    const q: string | undefined =
      input.search !== undefined && input.search.trim().length > 0
        ? input.search.trim()
        : undefined;
    if (q !== undefined) {
      const slice: string = q.length > 120 ? q.slice(0, 120) : q;
      andParts.push({
        OR: [
          { name: { contains: slice, mode: 'insensitive' } },
          { description: { contains: slice, mode: 'insensitive' } },
          { brand: { contains: slice, mode: 'insensitive' } },
        ],
      });
    }
    const categorySlug: string | undefined =
      input.categorySlug !== undefined && input.categorySlug.trim().length > 0
        ? input.categorySlug.trim()
        : undefined;
    const brandFilter: string | undefined =
      input.brand !== undefined && input.brand.trim().length > 0
        ? input.brand.trim()
        : undefined;
    return {
      isActive: true,
      ...(categorySlug !== undefined
        ? { category: { slug: categorySlug } }
        : {}),
      ...(brandFilter !== undefined
        ? { brand: { equals: brandFilter, mode: 'insensitive' } }
        : {}),
      ...(andParts.length > 0 ? { AND: andParts } : {}),
    };
  }

  private mapProduct(row: ProductRow): CatalogProductDto {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      brand: row.brand,
      priceVnd: Number(row.price),
      shortDescription: buildShortDescription(row.description, row.name),
      imageUrl: firstImageUrl(row.images),
      categorySlug: row.category?.slug ?? null,
      categoryName: row.category?.name ?? null,
    };
  }

  private mapProductDetail(row: ProductRow): CatalogProductDetailDto {
    const images: CatalogProductImageDto[] = mapProductImages(
      row.images,
      row.name,
    );
    const description: string =
      row.description !== null && row.description.trim().length > 0
        ? row.description.trim()
        : row.name;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      brand: row.brand,
      sku: row.sku,
      priceVnd: Number(row.price),
      description,
      images,
      categorySlug: row.category?.slug ?? null,
      categoryName: row.category?.name ?? null,
      stockQuantity: row.stockQuantity,
    };
  }
}

function buildShortDescription(
  description: string | null,
  fallbackName: string,
): string {
  if (description === null || description.trim().length === 0) {
    return fallbackName;
  }
  const trimmed: string = description.trim();
  if (trimmed.length <= 200) {
    return trimmed;
  }
  return `${trimmed.slice(0, 197)}…`;
}

type ImageSortRow = {
  readonly url: string;
  readonly altText: string;
  readonly sortOrder: number;
};

function mapProductImages(
  images: Prisma.JsonValue,
  fallbackAlt: string,
): CatalogProductImageDto[] {
  if (images === null || !Array.isArray(images)) {
    return [{ url: PLACEHOLDER_IMAGE, altText: fallbackAlt || 'Product' }];
  }
  const work: ImageSortRow[] = [];
  let index: number = 0;
  for (const item of images) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }
    const rec = item as {
      url?: unknown;
      altText?: unknown;
      sortOrder?: unknown;
    };
    const url: unknown = rec.url;
    if (typeof url !== 'string' || url.trim().length === 0) {
      continue;
    }
    const altRaw: unknown = rec.altText;
    const altText: string =
      typeof altRaw === 'string' && altRaw.trim().length > 0
        ? altRaw.trim()
        : fallbackAlt || 'Product';
    const sortRaw: unknown = rec.sortOrder;
    const sortOrder: number =
      typeof sortRaw === 'number' && Number.isFinite(sortRaw) ? sortRaw : index;
    work.push({ url: url.trim(), altText, sortOrder });
    index += 1;
  }
  work.sort((a: ImageSortRow, b: ImageSortRow) => a.sortOrder - b.sortOrder);
  if (work.length === 0) {
    return [{ url: PLACEHOLDER_IMAGE, altText: fallbackAlt || 'Product' }];
  }
  return work.map(
    (row: ImageSortRow): CatalogProductImageDto => ({
      url: row.url,
      altText: row.altText,
    }),
  );
}

function firstImageUrl(images: Prisma.JsonValue): string {
  const list: CatalogProductImageDto[] = mapProductImages(images, '');
  return list.length > 0 ? list[0].url : PLACEHOLDER_IMAGE;
}
