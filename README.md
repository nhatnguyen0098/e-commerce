# E-commerce monorepo

Full-stack e-commerce sample: a **NestJS** monorepo (API gateway + Kafka microservices), **React (Vite)** storefront, **PostgreSQL** per bounded context, **Redis** (catalog cache), and **Apache Kafka** for RPC-style messaging. Optional **OpenTelemetry** via Docker.

## Architecture

| Area | Stack |
|------|--------|
| API | `api-gateway` (HTTP), NestJS |
| Services | `user-service`, `auth-service`, `product-service`, `order-service`, `payment-service` (Kafka consumers/producers) |
| Data | Four PostgreSQL databases (user, product, order, payment), Prisma per service |
| Messaging | Kafka (NestJS microservices transport) |
| Cache | Redis (product catalog) |
| UI | React 19 + Vite + Tailwind |
| Deploy | `deploy/k8s` (Kustomize), `backend/Dockerfile` (single image, `NEST_APP` selects service) |

Infrastructure for local dev is defined in **`docker-compose.yml`** at the repository root.

## Prerequisites

- **Node.js** 22.x (recommended; matches `backend/Dockerfile`)
- **npm**
- **Docker** and **Docker Compose** v2
- **[Task](https://taskfile.dev/)** (optional but recommended for one-liner workflows)

## Environment variables

1. Copy the backend example file:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Adjust `backend/.env` for your machine. With the default Docker Compose Postgres ports, the URLs in `.env.example` usually work as-is. You typically also need:

   - `REDIS_URL` (e.g. `redis://127.0.0.1:6379`) for catalog caching in `product-service`
   - `API_GATEWAY_PORT` (default `3000`)
   - `AUTH_JWT_SECRET`, `AUTH_JWT_EXPIRES_IN` for auth

3. For the **frontend**, copy `frontend/.env.example` to `frontend/.env` if you change the API base URL (defaults assume the Vite dev server proxies or you set `VITE_*` as needed).

4. **Kubernetes secrets**: use `deploy/k8s/secret.env.example` as a template; never commit real `secret.env` files (they are gitignored).

## Quick start (Docker + local Node)

Run databases, Redis, and Kafka with Docker; run Nest apps and the Vite dev server on the host (hot reload).

### 1. Install dependencies

```bash
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Start Docker services

**Postgres + Redis** (matches `backend/.env.example` ports):

```bash
docker compose up -d postgres-user postgres-product postgres-order postgres-payment redis
```

**Kafka** and create RPC topics:

```bash
task kafka:start
```

Or manually:

```bash
docker compose up -d kafka
# wait until Kafka accepts connections, then create topics (see Taskfile `kafka:init-topics`)
```

### 3. Apply database schemas

```bash
task db:migrate
```

Equivalent:

```bash
cd backend
npx prisma db push --schema=apps/user-service/prisma/schema.prisma
npx prisma db push --schema=apps/product-service/prisma/schema.prisma
npx prisma db push --schema=apps/order-service/prisma/schema.prisma
npx prisma db push --schema=apps/payment-service/prisma/schema.prisma
```

After the first clone, Prisma clients are generated via `npm run prisma:generate` (also runs on `npm install` / `postinstall`).

### 4. Seed catalog (optional)

```bash
cd backend && npm run prisma:seed:product
```

### 5. Run applications

**Option A — Task (starts all Node services + frontend in the foreground):**

```bash
task db:up
task db:migrate
task kafka:start
task dev
```

**Option B — One-shot stack (same as above chained):**

```bash
task start:all
```

- **API gateway:** http://localhost:3000 (or `API_GATEWAY_PORT`)
- **Frontend:** http://localhost:5173 (Vite default)

Stop **Docker** stack:

```bash
task containers:down
```

The `task down` target only stops Nest processes it can match via `pkill`; stop the terminal running `task dev` / Vite with **Ctrl+C** where needed.

## Docker Compose services (reference)

| Service | Role |
|---------|------|
| `postgres-user`, `postgres-product`, `postgres-order`, `postgres-payment` | Databases |
| `redis` | Cache |
| `kafka` | Message broker |
| `otel-collector` | Optional telemetry (configure Grafana Cloud vars in `backend/.env`) |

Start everything defined in Compose (including optional collector):

```bash
docker compose up -d
```

## Backend Docker image (Kubernetes / registry)

From `backend/`:

```bash
docker build -t e-commerce-backend:latest .
```

Run the gateway locally with the image:

```bash
docker run --rm -e NEST_APP=api-gateway -e KAFKA_BROKERS=host.docker.internal:9092 \
  --env-file backend/.env -p 3000:3000 e-commerce-backend:latest
```

Adjust env and `KAFKA_BROKERS` for your network. Kubernetes manifests live under **`deploy/k8s`** (`kubectl apply -k deploy/k8s`).

## Load testing (k6)

From `backend/`:

```bash
npm run k6:smoke
npm run k6:load-catalog
```

Without a local k6 binary:

```bash
npm run k6:smoke:docker
```

Set `BASE_URL` if the API is not on `http://127.0.0.1:3000`.

## Repository layout

```
e-commerce/
├── backend/           # NestJS monorepo (apps, libs, k6, Dockerfile)
├── frontend/          # Vite + React storefront
├── deploy/k8s/        # Kustomize (namespace, infra, backend workloads)
├── docker-compose.yml # Local infrastructure
├── Taskfile.yml       # Task runner recipes
└── README.md
```

## License

Private / unlicensed unless otherwise stated in `package.json` files.
