# --- ETAPA 1: CONSTRUCCIÓN (BUILD) ---
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

RUN npm install

COPY . .

ARG SERVICE_NAME=analytics-service

RUN npx nx run ${SERVICE_NAME}:build

# --- ETAPA 2: PRODUCCIÓN (FINAL) ---
FROM node:20-alpine AS final

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./

RUN npm install --omit=dev --ignore-scripts

ARG SERVICE_PORT=3010
EXPOSE ${SERVICE_PORT}

ARG SERVICE_NAME=analytics-service
COPY --from=builder /app/dist/apps/${SERVICE_NAME} ./dist/

CMD ["node", "dist/main.js"]
