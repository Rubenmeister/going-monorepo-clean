# --- ETAPA 1: CONSTRUCCIÓN (BUILD) ---
# Usamos una imagen Node ligera para compilar el TypeScript
FROM node:20-slim AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de configuración de paquetes (npm/package-lock)
COPY package.json package-lock.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY jest.config.js ./ # Para que Nx lo use si es necesario

# Instala todas las dependencias
RUN npm install

# Copia todo el código del monorepo
COPY . .

# Expón el puerto de tu servicio (ej. 3001)
ARG SERVICE_NAME

# Ejecuta el comando de construcción de Nx para el servicio específico
# El resultado se guarda en 'dist/apps/<nombre-del-servicio>'
RUN npx nx run ${SERVICE_NAME}:build

# --- ETAPA 2: PRODUCCIÓN (FINAL) ---
# Usamos una imagen base más pequeña para el runtime (ejecución)
FROM node:20-alpine AS final

# Recrea el directorio de trabajo
WORKDIR /app

# Copia SÓLO el package.json y package-lock.json para reinstalar dependencias
COPY --from=builder /app/package.json /app/package-lock.json ./

# Copia SÓLO las dependencias de producción (más seguro y pequeño)
# El flag '--omit=dev' ignora Jest, TypeScript y otros paquetes grandes de desarrollo
RUN npm install --omit=dev --ignore-scripts

# Expón el puerto de la aplicación (esto es solo metadatos)
ARG SERVICE_PORT=3001
EXPOSE ${SERVICE_PORT}

# Copia el código COMPILADO de la etapa 'builder'
ARG SERVICE_NAME
COPY --from=builder /app/dist/apps/${SERVICE_NAME} ./dist/

# Comando para iniciar la aplicación Node compilada
CMD ["node", "dist/main.js"]