FROM node:20-slim

WORKDIR /app

# Instalar git (necesario para commit_fix)
RUN apt-get update && apt-get install -y git ca-certificates && rm -rf /var/lib/apt/lists/*

# Configurar git para el agente
RUN git config --global user.email "agent@goingec.com" && \
    git config --global user.name "Going Agent"

# Copiar dependencias
COPY package.json ./
RUN npm install --omit=dev

# Copiar código fuente compilado
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm install -g ts-node typescript && npm install

# Variables de entorno requeridas en Cloud Run:
# ANTHROPIC_API_KEY, GCP_PROJECT, REPO_PATH, GIT_TOKEN

CMD ["npx", "ts-node", "src/index.ts"]
