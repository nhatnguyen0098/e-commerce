import { PrismaClient } from '@prisma/client';

type GlobalPrisma = typeof globalThis & {
  prisma?: PrismaClient;
};

const globalRef: GlobalPrisma = globalThis;

/**
 * Shared PrismaClient instance per process.
 */
export function getPrismaClient(): PrismaClient {
  if (!globalRef.prisma) {
    globalRef.prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return globalRef.prisma;
}
