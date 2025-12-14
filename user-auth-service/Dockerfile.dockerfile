# ETAPA 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copiamos archivos de configuración de dependencias
COPY package*.json ./

# Instalamos todas las dependencias (incluyendo devDependencies para compilar)
RUN npm ci

# Copiamos el código fuente de todo el monorepo
COPY . .

# Compilamos la app específica (usando Nx)
RUN npx nx build user-auth-service --prod

# ETAPA 2: Runner (Producción)
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiamos solo los node_modules de producción (opcional: o hacemos prune)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiamos el build desde la etapa anterior
# Nota: Verifica la ruta de salida en tu nx.json, usualmente es dist/apps/nombre-app
COPY --from=builder /app/dist/apps/user-auth-service ./dist

USER node

EXPOSE 3333

CMD ["node", "dist/main.js"]