# Database utilities (`libs/database`)

- **`create-prisma-client.ts`** — generic singleton helper (`getOrCreatePrismaClient`) keyed per process.
- Each microservice defines its own Prisma client wrapper under `apps/<service>/src/*-prisma-client.ts` using the generated client (`@prisma-user/client`, `@prisma-product/client`, etc.).
- Each service sets its database URL at runtime before bootstrapping (`USER_DATABASE_URL`, `PRODUCT_DATABASE_URL`, …).
- Prisma schemas are service-scoped under `apps/*/prisma/schema.prisma`.
