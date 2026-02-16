# --- Stage 1: Build ---
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./
RUN npm ci

COPY . .

ARG SERVICE_NAME
RUN npx nx run ${SERVICE_NAME}:build

# --- Stage 2: Production ---
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

ARG SERVICE_NAME
ARG SERVICE_PORT=3007
ENV PORT=${SERVICE_PORT}

COPY --from=builder /app/dist/${SERVICE_NAME} ./dist/

USER appuser
EXPOSE ${SERVICE_PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health/live || exit 1

CMD ["node", "dist/main.js"]
