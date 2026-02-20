# --- BUILD STAGE ---
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

RUN npm install --omit=dev

COPY . .

ARG SERVICE_NAME=ratings-service

RUN npx nx run ${SERVICE_NAME}:build

# --- PRODUCTION STAGE ---
FROM node:20-alpine AS final

WORKDIR /app

ARG SERVICE_NAME=ratings-service
EXPOSE 3009

COPY --from=builder /app/package.json /app/package-lock.json ./

RUN npm install --omit=dev --ignore-scripts

COPY --from=builder /app/dist/apps/${SERVICE_NAME} ./dist/

CMD ["node", "dist/main.js"]
