# --- ETAPA 1: CONSTRUCCIÓN (BUILD) ---
# Usamos una imagen Node ligera para compilar
FROM node:20-slim AS builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de configuración de paquetes (npm/package-lock)
# Usamos la carpeta raíz del monorepo (el contexto de build)
COPY package.json package-lock.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
# Copia los archivos de configuración de Nest/Next/etc que estén en la raíz
# COPY .eslintrc.json ./

# Instala las dependencias (solo de producción por ahora)
RUN npm install --omit=dev

# Copia todo el código del monorepo
COPY . .

# Expón el puerto de tu servicio (ej. 3001)
ARG SERVICE_NAME=payment-service

# Ejecuta el comando de construcción de Nx para el servicio específico
# Esto transpila el código TypeScript a JavaScript en 'dist/apps/payment-service'
# Asegúrate de que el comando en package.json sea `nx build payment-service`
RUN npx nx run ${SERVICE_NAME}:build

# --- ETAPA 2: PRODUCCIÓN (FINAL) ---
# Usamos una imagen aún más pequeña para el runtime (ejecución)
FROM node:20-alpine AS final

# Recrea el directorio de trabajo
WORKDIR /app

# Copia SOLO la carpeta 'dist' del servicio construido
# El puerto 3001 es el que definimos en main.ts
ARG SERVICE_NAME=payment-service
EXPOSE 3001

# Copia los archivos necesarios para la ejecución:
# 1. package.json y package-lock.json
COPY --from=builder /app/package.json /app/package-lock.json ./

# 2. Copia SÓLO las dependencias de producción (más seguro y pequeño)
RUN npm install --omit=dev --ignore-scripts

# 3. Copia el código compilado
COPY --from=builder /app/dist/apps/${SERVICE_NAME} ./dist/

# 4. Copia el .env si lo necesitas para la ejecución
# (Idealmente, usarías secretos de K8s/Docker Swarm, pero para testing local)
# COPY .env .env 

# Comando para iniciar la aplicación Node compilada
CMD ["node", "dist/main.js"]