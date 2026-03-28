# Backend (NestJS monorepo)

Kafka-based **microservices** and an **HTTP API gateway**, sharing `libs/` (common config, contracts, database helpers). See the **[repository root README](../README.md)** for Docker Compose, Task workflows, and full-stack setup.

## Applications (`apps/`)

| App               | Role                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------- |
| `api-gateway`     | Public HTTP API (catalog, auth, users, orders); calls other services via Kafka clients |
| `user-service`    | User profiles and identity-related RPC                                                 |
| `auth-service`    | Register, login, logout; JWT issuance                                                  |
| `product-service` | Catalog RPC; Prisma + optional Redis cache                                             |
| `order-service`   | Checkout and order RPC; orchestrates other services over Kafka                         |
| `payment-service` | Payment RPC for orders                                                                 |

## Shared libraries (`libs/`)

- **`common`** — Kafka options, Redis module, guards, RPC helpers, observability hooks
- **`contracts`** — Shared TypeScript types and Kafka message pattern constants
- **`database`** — Prisma client singleton helpers

## Prerequisites

- Node.js 22.x recommended
- Running **Kafka**, **PostgreSQL** (four databases), and **Redis** as described in the root README (Docker Compose)

## Install

```bash
npm install
```

`postinstall` runs **`npm run prisma:generate`** so `@prisma-user/client`, `@prisma-product/client`, `@prisma-order/client`, and `@prisma-payment/client` exist under `node_modules/`.

## Environment

Copy and edit:

```bash
cp .env.example .env
```

Key variables: per-service `*_DATABASE_URL`, `KAFKA_BROKERS`, `REDIS_URL`, `AUTH_JWT_SECRET`, `API_GATEWAY_PORT`, optional `API_GATEWAY_CORS_ORIGIN` and OpenTelemetry / Grafana settings (see `.env.example`).

## Run (development)

From `backend/`:

| Script                              | Service         |
| ----------------------------------- | --------------- |
| `npm run start:dev`                 | API gateway     |
| `npm run start:user-service:dev`    | User service    |
| `npm run start:auth-service:dev`    | Auth service    |
| `npm run start:product-service:dev` | Product service |
| `npm run start:order-service:dev`   | Order service   |
| `npm run start:payment-service:dev` | Payment service |

Or use **`task dev`** / **`task start:all`** from the repository root.

## Build

```bash
npm run build
```

Production entry for the gateway:

```bash
npm run start:prod
```

Other services: run `node` on the matching `dist/apps/<app>/apps/<app>/src/main.js` (see `docker-entrypoint.sh` and `Dockerfile`).

## Prisma

Each service with a database has its own schema under `apps/<service>/prisma/schema.prisma`.

```bash
npm run prisma:generate
```

Apply schema to databases (local dev often uses `db push` from the root Taskfile):

```bash
npx prisma db push --schema=apps/user-service/prisma/schema.prisma
# … repeat for product, order, payment
```

Seed sample catalog data:

```bash
npm run prisma:seed:product
```

## Docker image

Single image; set **`NEST_APP`** to `api-gateway`, `user-service`, etc.

```bash
docker build -t e-commerce-backend:latest .
```

## Load tests (k6)

```bash
npm run k6:smoke
npm run k6:load-catalog
npm run k6:smoke:docker   # if k6 is not installed locally
```

## Tests and lint

```bash
npm run test
npm run test:e2e
npm run lint
```

## Observability

Config samples live under **`observability/`** (OpenTelemetry collector, Grafana dashboard skeleton). Optional Docker service: `otel-collector` in root `docker-compose.yml`.

## Kubernetes

Manifests: **`../deploy/k8s/`** (Kustomize). Image name in overlays should match your registry build of this Dockerfile.
