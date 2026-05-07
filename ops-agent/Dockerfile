# ── Stage 1: Builder ─────────────────────────────────────────────────────
# Compila TypeScript a JS para que el runtime no necesite ts-node.
FROM node:20-slim AS builder
WORKDIR /app

# Instala TODAS las deps (incl. typescript devDep) para poder compilar.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src

# Genera dist/index.js + dist/**/*.js
RUN npx tsc

# ── Stage 2: Runtime ─────────────────────────────────────────────────────
# Imagen mínima: solo deps de prod + JS compilado.
FROM node:20-slim AS runtime
WORKDIR /app

# CA certs para conexiones TLS a Mongo Atlas / Telegram / GCP.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Solo prod deps (excluye typescript, ts-node, @types/*).
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

# JS compilado del builder.
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

# Cron-triggered Cloud Run Job; arranque rápido sin transpile en runtime.
CMD ["node", "dist/index.js"]
