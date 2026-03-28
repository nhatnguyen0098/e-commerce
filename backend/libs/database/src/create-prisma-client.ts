type PrismaClientConstructor<TClient> = new (input?: {
  log?: ('error' | 'warn')[];
}) => TClient;

type GetOrCreatePrismaClientInput<TClient> = {
  readonly key: string;
  readonly prismaClientClass: PrismaClientConstructor<TClient>;
};

type GlobalWithDynamicPrisma = typeof globalThis & {
  [key: string]: unknown;
};

/**
 * Returns a singleton Prisma client instance by key.
 */
export function getOrCreatePrismaClient<TClient>(
  input: GetOrCreatePrismaClientInput<TClient>,
): TClient {
  const globalRef: GlobalWithDynamicPrisma = globalThis;
  const currentValue: unknown = globalRef[input.key];
  if (currentValue !== undefined) {
    return currentValue as TClient;
  }
  const createdClient: TClient = new input.prismaClientClass({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
  globalRef[input.key] = createdClient;
  return createdClient;
}
