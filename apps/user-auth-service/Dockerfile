FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# COPIA CORREGIDA: Apunta directo a la carpeta del servicio
COPY dist/user-auth-service ./dist
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --only=production --legacy-peer-deps

EXPOSE 3333
CMD ["node", "dist/main.js"]
