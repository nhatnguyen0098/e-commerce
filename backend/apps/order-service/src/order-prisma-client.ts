import { PrismaClient } from '@prisma-order/client';
import { getOrCreatePrismaClient } from '@database/create-prisma-client';

export function getOrderPrismaClient(): PrismaClient {
  return getOrCreatePrismaClient<PrismaClient>({
    key: 'orderPrisma',
    prismaClientClass: PrismaClient,
  });
}
