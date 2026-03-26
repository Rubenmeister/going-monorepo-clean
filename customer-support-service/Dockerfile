# ── Build stage ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json y eliminar la dependencia local no usada
COPY package.json ./
RUN node -e "const p=require('./package.json'); delete p.dependencies['@dataconnect/generated']; require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2));"

RUN npm install

# Copiar fuentes y tsconfig
COPY tsconfig.json ./
COPY src ./src

# Compilar TypeScript
RUN npx tsc --outDir ./dist --rootDir ./src

# ── Runtime stage ─────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN node -e "const p=require('./package.json'); delete p.dependencies['@dataconnect/generated']; require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2));"
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/main.js"]
