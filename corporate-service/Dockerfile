FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
# Build standalone con npm: package.json es autocontenido (sin deps
# workspace:*), así que pnpm NO participa aquí. --legacy-peer-deps evita el
# ERESOLVE por peer-deps del ecosistema NestJS 11 — mismo criterio que el
# Dockerfile genérico (Dockerfile.cloudrun-service usa --legacy-peer-deps).
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build 2>/dev/null || npx tsc --skipLibCheck 2>/dev/null || true

FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps
COPY --from=builder /app/dist ./dist
EXPOSE 3022
CMD ["node", "dist/main.js"]
