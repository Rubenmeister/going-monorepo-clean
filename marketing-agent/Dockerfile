# ── Stage 1: Builder ─────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src

RUN npx tsc

# ── Stage 2: Runtime ─────────────────────────────────────────────────────
FROM node:20-slim AS runtime
WORKDIR /app

# CA certs para TLS (Anthropic, Telegram, Meta Graph, Twitter, TikTok,
# YouTube, LinkedIn, Threads, Firestore).
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
