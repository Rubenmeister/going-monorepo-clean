# --- ETAPA 1: CONSTRUCCIÓN (BUILD) ---
# pnpm + Nx sobre el monorepo. node_modules y dist se excluyen vía .dockerignore.
FROM node:20-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install --no-frozen-lockfile
ARG SERVICE_NAME
ENV NX_GENERATE_PRUNED_LOCKFILE=false
RUN pnpm exec nx run ${SERVICE_NAME}:build --skip-nx-cache

# --- ETAPA 2: PRODUCCIÓN ---
# dist/<servicio> es autocontenido (webpack + generatePackageJson):
# main.js + package.json podado con SOLO las deps de runtime (todas de npm).
FROM node:20-slim AS final
WORKDIR /app
RUN npm install -g pnpm
ARG SERVICE_NAME
ENV NODE_ENV=production
EXPOSE 8080
COPY --from=builder /app/dist/${SERVICE_NAME}/ ./
# Se ignora el lockfile podado (trae refs file: rotas) y se instala prod
# con node_modules aplanado (--shamefully-hoist) para que el bundle de
# webpack resuelva sus deps transitivas (p.ej. tslib).
RUN rm -f pnpm-lock.yaml package-lock.json \
    && pnpm install --prod --no-frozen-lockfile --shamefully-hoist
CMD ["node", "main.js"]
