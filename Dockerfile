# Multi-stage build for Going Platform

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Development dependencies
FROM dependencies AS dev-dependencies
RUN npm ci

# Stage 3: Builder
FROM dev-dependencies AS builder
WORKDIR /app
COPY . .
RUN npm run build:all

# Stage 4: Transport Service Runtime
FROM node:18-alpine AS transport-service
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/transport-service/dist ./dist
COPY transport-service/package*.json ./
ENV NODE_ENV=production
EXPOSE 3003
CMD ["node", "dist/main.js"]

# Stage 5: Payment Service Runtime
FROM node:18-alpine AS payment-service
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/payment-service/dist ./dist
COPY payment-service/package*.json ./
ENV NODE_ENV=production
EXPOSE 3004
CMD ["node", "dist/main.js"]

# Stage 6: Ratings Service Runtime
FROM node:18-alpine AS ratings-service
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/ratings-service/dist ./dist
COPY ratings-service/package*.json ./
ENV NODE_ENV=production
EXPOSE 3005
CMD ["node", "dist/main.js"]

# Stage 7: Analytics Service Runtime
FROM node:18-alpine AS analytics-service
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/analytics-service/dist ./dist
COPY analytics-service/package*.json ./
ENV NODE_ENV=production
EXPOSE 3006
CMD ["node", "dist/main.js"]

# Stage 8: Chat Service Runtime
FROM node:18-alpine AS chat-service
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/chat-service/dist ./dist
COPY chat-service/package*.json ./
ENV NODE_ENV=production
EXPOSE 3007
CMD ["node", "dist/main.js"]

# Stage 9: Geolocation Service Runtime
FROM node:18-alpine AS geolocation-service
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/geolocation-service/dist ./dist
COPY geolocation-service/package*.json ./
ENV NODE_ENV=production
EXPOSE 3008
CMD ["node", "dist/main.js"]
