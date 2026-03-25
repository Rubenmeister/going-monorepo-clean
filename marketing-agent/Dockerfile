FROM node:20-slim

WORKDIR /app

# Install ts-node globally
RUN npm install -g ts-node typescript

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

CMD ["ts-node", "src/index.ts"]
