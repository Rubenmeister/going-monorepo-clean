# --- ETAPA 1: CONSTRUCCIÓN (BUILD) ---
FROM node:20-slim AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar TODO primero para que pnpm vea los package.json de todos los workspaces
COPY . .

# Instalar dependencias con pnpm (lee todos los workspace package.json)
RUN pnpm install --no-frozen-lockfile

# Build del servicio con Nx
# NX_GENERATE_PRUNED_LOCKFILE=false evita que pnpm falle al parsear
# entradas "file:" del lockfile al crear el pruned lockfile de deploy
ARG SERVICE_NAME=transport-service
ENV NX_GENERATE_PRUNED_LOCKFILE=false
RUN pnpm exec nx run ${SERVICE_NAME}:build --skip-nx-cache

# --- ETAPA 2: PRODUCCIÓN ---
FROM node:20-slim AS final

WORKDIR /app

RUN npm install -g pnpm

ARG SERVICE_NAME=transport-service
EXPOSE 3000

# Copiar archivos necesarios para instalar deps de producción
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/transport-service/package.json ./transport-service/package.json
# El stub dataconnect-generated es requerido por pnpm-lock.yaml (referencia file:)
COPY --from=builder /app/transport-service/src/dataconnect-generated ./transport-service/src/dataconnect-generated
RUN pnpm install --no-frozen-lockfile --prod

# Copiar código compilado
COPY --from=builder /app/dist/apps/${SERVICE_NAME} ./dist/

CMD ["node", "dist/main.js"]
