import { Injectable } from '@nestjs/common';
import type { Prisma, Product } from '@prisma-product/client';
import { getProductPrismaClient } from './product-prisma-client';

type ProductRow = Product & {
  readonly category: { readonly slug: string; readonly name: string } | null;
};

@Injectable()
export class ProductRepository {
  public async listCategories(): Promise<
    readonly {
      readonly id: string;
      readonly name: string;
      readonly slug: string;
    }[]
  > {
    const prisma = getProductPrismaClient();
    return prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  }
  public async listBrands(): Promise<readonly { readonly brand: string }[]> {
    const prisma = getProductPrismaClient();
    return prisma.product.findMany({
      where: { isActive: true, brand: { not: '' } },
      select: { brand: true },
      distinct: ['brand'],
      orderBy: { brand: 'asc' },
    });
  }
  public async countProducts(where: Prisma.ProductWhereInput): Promise<number> {
    const prisma = getProductPrismaClient();
    return prisma.product.count({ where });
  }
  public async findProducts(input: {
    readonly where: Prisma.ProductWhereInput;
    readonly take: number;
  }): Promise<ProductRow[]> {
    const prisma = getProductPrismaClient();
    return prisma.product.findMany({
      where: input.where,
      take: input.take,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      include: { category: { select: { slug: true, name: true } } },
    }) as Promise<ProductRow[]>;
  }
  public async findActiveProductBySlug(
    slug: string,
  ): Promise<ProductRow | null> {
    const prisma = getProductPrismaClient();
    return prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { category: { select: { slug: true, name: true } } },
    }) as Promise<ProductRow | null>;
  }
  public async findActiveProductsByIds(
    ids: readonly string[],
  ): Promise<ProductRow[]> {
    const prisma = getProductPrismaClient();
    return prisma.product.findMany({
      where: { id: { in: [...ids] }, isActive: true },
      include: { category: { select: { slug: true, name: true } } },
    }) as Promise<ProductRow[]>;
  }
}
