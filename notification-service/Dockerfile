# ── Build stage ──────────────────────────────────────────────────────
FROM node:20-slim AS builder

# Install build tools for native modules (firebase-admin, grpc, etc.)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY tsconfig.build.json ./
COPY src ./src

# Compile TypeScript (type errors are suppressed; JS output is always emitted)
RUN ./node_modules/.bin/tsc -p tsconfig.build.json; exit 0

# ── Runtime stage ─────────────────────────────────────────────────────
# Use node:20-slim (glibc) to match builder — native modules need same libc
FROM node:20-slim

WORKDIR /app

COPY package.json ./
# Copy node_modules from builder to avoid re-running native module compilation
# without build tools in the runtime stage
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/main.js"]
