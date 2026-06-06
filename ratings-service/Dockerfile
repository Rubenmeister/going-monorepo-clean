# ratings-service: depende de @dataconnect/generated (file:) y no genera
# package.json podado. Patrón estilo transport-service: instala deps de
# producción desde el lockfile raíz, copiando el stub file: requerido.
FROM node:20-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install --no-frozen-lockfile
ARG SERVICE_NAME
ENV NX_GENERATE_PRUNED_LOCKFILE=false
RUN pnpm exec nx run ${SERVICE_NAME}:build --skip-nx-cache

FROM node:20-slim AS final
WORKDIR /app
RUN npm install -g pnpm
ARG SERVICE_NAME
ENV NODE_ENV=production
EXPOSE 8080
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/${SERVICE_NAME}/package.json ./${SERVICE_NAME}/package.json
COPY --from=builder /app/${SERVICE_NAME}/src/dataconnect-generated ./${SERVICE_NAME}/src/dataconnect-generated
RUN pnpm install --prod --no-frozen-lockfile --shamefully-hoist
COPY --from=builder /app/dist/${SERVICE_NAME} ./dist/
CMD ["node", "dist/main.js"]
