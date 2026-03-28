# Database utilities (`libs/database`)

- Services share `getPrismaClient` from `@database/prisma.singleton`.
- Each service sets its own database URL at runtime before bootstrapping:
  - `USER_DATABASE_URL`
  - `PRODUCT_DATABASE_URL`
  - `ORDER_DATABASE_URL`
  - `PAYMENT_DATABASE_URL`
- Prisma schemas are service-scoped under `apps/*/prisma/schema.prisma`.
