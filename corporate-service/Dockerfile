FROM node:20-alpine AS builder
WORKDIR /app
# El CD construye con contexto = raíz del monorepo (`docker build ... .`) y
# `-f corporate-service/Dockerfile`, así que las rutas llevan el prefijo
# `corporate-service/`. Build standalone con npm: el package.json es
# autocontenido (sin deps workspace:*), por eso pnpm NO participa aquí.
# --legacy-peer-deps evita el ERESOLVE de peer-deps del ecosistema NestJS 11
# (mismo criterio que el Dockerfile genérico, Dockerfile.cloudrun-service).
COPY corporate-service/package.json ./
RUN npm install --legacy-peer-deps
COPY corporate-service/ ./
# tsconfig.json es autocontenido (outDir ./dist, src/ → dist/main.js).
RUN npx tsc --skipLibCheck

FROM node:20-alpine
WORKDIR /app
COPY corporate-service/package.json ./
RUN npm install --omit=dev --legacy-peer-deps
COPY --from=builder /app/dist ./dist
EXPOSE 3022
CMD ["node", "dist/main.js"]
