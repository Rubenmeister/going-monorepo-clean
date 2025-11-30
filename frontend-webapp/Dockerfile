# ETAPA 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

# Compilamos el frontend
RUN npx nx build frontend-webapp --prod

# ETAPA 2: Servidor Nginx
FROM nginx:alpine AS runner

# Copiamos el build estático a la carpeta de Nginx
COPY --from=builder /app/dist/apps/frontend-webapp /usr/share/nginx/html

# Copiamos nuestra configuración personalizada de Nginx (ver paso siguiente)
COPY apps/frontend-webapp/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]