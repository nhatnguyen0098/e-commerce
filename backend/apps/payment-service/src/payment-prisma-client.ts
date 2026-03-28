import { PrismaClient } from '@prisma-payment/client';
import { getOrCreatePrismaClient } from '@database/create-prisma-client';

export function getPaymentPrismaClient(): PrismaClient {
  return getOrCreatePrismaClient<PrismaClient>({
    key: 'paymentPrisma',
    prismaClientClass: PrismaClient,
  });
}
