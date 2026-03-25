FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install --omit=dev
RUN npm install -g ts-node typescript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm install
CMD ["npx", "ts-node", "src/index.ts"]
