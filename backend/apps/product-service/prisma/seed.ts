import 'dotenv/config';
import { PrismaClient } from '@prisma-product/client';

type SeedCategory = {
  readonly name: string;
  readonly slug: string;
  readonly sortOrder: number;
};

type SeedProduct = {
  readonly categorySlug: string;
  readonly name: string;
  readonly slug: string;
  readonly brand: string;
  readonly description: string;
  readonly sku: string;
  readonly price: string;
  readonly stockQuantity: number;
  readonly images: readonly {
    readonly url: string;
    readonly altText: string;
    readonly sortOrder: number;
  }[];
};

const prisma: PrismaClient = new PrismaClient();

const categories: readonly SeedCategory[] = [
  { name: 'Sneakers', slug: 'sneakers', sortOrder: 1 },
  { name: 'T-Shirts', slug: 't-shirts', sortOrder: 2 },
  { name: 'Accessories', slug: 'accessories', sortOrder: 3 },
];

const products: readonly SeedProduct[] = [
  {
    categorySlug: 'sneakers',
    name: 'Cloud Runner X1',
    slug: 'cloud-runner-x1',
    brand: 'Ecom Sport',
    description: 'Lightweight running shoes for everyday training.',
    sku: 'SHO-CRX1-BLK-42',
    price: '1290000',
    stockQuantity: 30,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900',
        altText: 'Cloud Runner X1',
        sortOrder: 0,
      },
    ],
  },
  {
    categorySlug: 't-shirts',
    name: 'Essential Cotton Tee',
    slug: 'essential-cotton-tee',
    brand: 'Ecom Basic',
    description: 'Soft cotton t-shirt with regular fit.',
    sku: 'TEE-ECT-WHT-L',
    price: '249000',
    stockQuantity: 80,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900',
        altText: 'Essential Cotton Tee',
        sortOrder: 0,
      },
    ],
  },
  {
    categorySlug: 'accessories',
    name: 'Urban Crossbody Bag',
    slug: 'urban-crossbody-bag',
    brand: 'Ecom Gear',
    description: 'Compact crossbody bag for daily commute.',
    sku: 'BAG-UCB-BLK-01',
    price: '499000',
    stockQuantity: 45,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=900',
        altText: 'Urban Crossbody Bag',
        sortOrder: 0,
      },
    ],
  },
];

async function executeSeed(): Promise<void> {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
      },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
      },
    });
  }
  for (const product of products) {
    const category = await prisma.category.findUnique({
      where: { slug: product.categorySlug },
      select: { id: true },
    });
    if (category === null) {
      throw new Error(`Category not found: ${product.categorySlug}`);
    }
    await prisma.product.upsert({
      where: { sku: product.sku },
      create: {
        categoryId: category.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        description: product.description,
        sku: product.sku,
        price: product.price,
        stockQuantity: product.stockQuantity,
        isActive: true,
        images: product.images,
      },
      update: {
        categoryId: category.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        description: product.description,
        price: product.price,
        stockQuantity: product.stockQuantity,
        isActive: true,
        images: product.images,
      },
    });
  }
}

executeSeed()
  .then(async () => {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log('Product seed completed.');
  })
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
