# ── Stage 1: Builder ─────────────────────────────────────────────────────
# Compila TS a JS para que el runtime no necesite ts-node.
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src

RUN npx tsc

# ── Stage 2: Runtime ─────────────────────────────────────────────────────
# Necesita `git` para clonar el repo + commit/push (el agente edita código).
FROM node:20-slim AS runtime
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Identidad de los commits que el agente hace en agent/fixes.
RUN git config --global user.email "agent@goingec.com" \
 && git config --global user.name "Going Agent"

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
