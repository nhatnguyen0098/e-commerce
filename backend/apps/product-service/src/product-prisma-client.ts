import { PrismaClient } from '@prisma-product/client';
import { getOrCreatePrismaClient } from '@database/create-prisma-client';

export function getProductPrismaClient(): PrismaClient {
  return getOrCreatePrismaClient<PrismaClient>({
    key: 'productPrisma',
    prismaClientClass: PrismaClient,
  });
}
