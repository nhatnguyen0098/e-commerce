import { PrismaClient } from '@prisma-user/client';
import { getOrCreatePrismaClient } from '@database/create-prisma-client';

export function getUserPrismaClient(): PrismaClient {
  return getOrCreatePrismaClient<PrismaClient>({
    key: 'userPrisma',
    prismaClientClass: PrismaClient,
  });
}
