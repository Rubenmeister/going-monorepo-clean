# --- ETAPA 1: CONSTRUCCION (BUILD) ---
# Usamos una imagen Node ligera para compilar
FROM node:20-slim AS builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de configuracion de paquetes (npm/package-lock)
# Usamos la carpeta raiz del monorepo (el contexto de build)
COPY package.json package-lock.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Instala las dependencias (solo de produccion por ahora)
RUN npm install --omit=dev

# Copia todo el codigo del monorepo
COPY . .

# Expone el puerto de tu servicio
ARG SERVICE_NAME=blog-service

# Ejecuta el comando de construccion de Nx para el servicio especifico
RUN npx nx run ${SERVICE_NAME}:build

# --- ETAPA 2: PRODUCCION (FINAL) ---
# Usamos una imagen aun mas pequena para el runtime (ejecucion)
FROM node:20-alpine AS final

# Recrea el directorio de trabajo
WORKDIR /app

# Copia SOLO la carpeta 'dist' del servicio construido
ARG SERVICE_NAME=blog-service
EXPOSE 3010

# Copia los archivos necesarios para la ejecucion:
# 1. package.json y package-lock.json
COPY --from=builder /app/package.json /app/package-lock.json ./

# 2. Copia SOLO las dependencias de produccion (mas seguro y pequeno)
RUN npm install --omit=dev --ignore-scripts

# 3. Copia el codigo compilado
COPY --from=builder /app/dist/apps/${SERVICE_NAME} ./dist/

# Comando para iniciar la aplicacion Node compilada
CMD ["node", "dist/main.js"]
