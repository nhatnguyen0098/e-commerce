# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG PRISMA_DUMMY_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
ENV USER_DATABASE_URL=${PRISMA_DUMMY_URL} \
    PRODUCT_DATABASE_URL=${PRISMA_DUMMY_URL} \
    ORDER_DATABASE_URL=${PRISMA_DUMMY_URL} \
    PAYMENT_DATABASE_URL=${PRISMA_DUMMY_URL}
RUN npx prisma generate --schema=apps/user-service/prisma/schema.prisma \
  && npx prisma generate --schema=apps/product-service/prisma/schema.prisma \
  && npx prisma generate --schema=apps/order-service/prisma/schema.prisma \
  && npx prisma generate --schema=apps/payment-service/prisma/schema.prisma
ENV NODE_ENV=production
RUN npm run build \
  && npm prune --omit=dev

FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && addgroup -g 1001 -S nodejs \
  && adduser -S nestjs -u 1001 -G nodejs \
  && chown -R nestjs:nodejs /app
USER nestjs
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
