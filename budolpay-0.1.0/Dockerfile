# BudolPay Monorepo Dockerfile
# Purpose: Multi-stage build for BudolPay microservices

FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy root package files
COPY package*.json ./
# Copy workspace packages
COPY packages/ ./packages/
# Copy services
COPY services/ ./services/

# Install dependencies for the whole monorepo
RUN npm install --ignore-scripts
# Build shared packages (e.g., @budolpay/audit)
RUN npm run build --workspaces --if-present
# Generate Prisma Client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# --- Target: API Gateway ---
FROM base AS gateway
EXPOSE 8080
CMD ["node", "services/api-gateway/index.js"]

# --- Target: Auth Service ---
FROM base AS auth
EXPOSE 8001
CMD ["node", "services/auth-service/index.js"]

# --- Target: Wallet Service ---
FROM base AS wallet
EXPOSE 8002
CMD ["node", "services/wallet-service/index.js"]

# --- Target: Transaction Service ---
FROM base AS transaction
EXPOSE 8003
CMD ["node", "services/transaction-service/index.js"]
