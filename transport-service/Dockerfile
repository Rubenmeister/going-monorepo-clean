# --- ETAPA 1: CONSTRUCCIÓN (BUILD) ---
FROM node:20-slim AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de configuración del monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY nx.json tsconfig.base.json ./

# Instalar dependencias con pnpm
RUN pnpm install --no-frozen-lockfile

# Copiar todo el código
COPY . .

# Build del servicio con Nx
ARG SERVICE_NAME=transport-service
RUN pnpm exec nx run ${SERVICE_NAME}:build --skip-nx-cache

# --- ETAPA 2: PRODUCCIÓN ---
FROM node:20-slim AS final

WORKDIR /app

RUN npm install -g pnpm

ARG SERVICE_NAME=transport-service
EXPOSE 3000

# Copiar archivos necesarios para instalar deps de producción
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
RUN pnpm install --no-frozen-lockfile --prod

# Copiar código compilado
COPY --from=builder /app/dist/apps/${SERVICE_NAME} ./dist/

CMD ["node", "dist/main.js"]
