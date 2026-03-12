# BudolAccounting Dockerfile
# Purpose: Containerize the accounting service
# Dependency: Requires @budolpay/database from sibling directory

FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy shared database package
COPY budolpay-0.1.0/packages/database ./budolpay-0.1.0/packages/database
RUN cd budolpay-0.1.0/packages/database && npm install && npx prisma generate

# Copy accounting service
WORKDIR /app/budolAccounting-0.1.0
COPY budolAccounting-0.1.0/package*.json ./
RUN npm install
COPY budolAccounting-0.1.0/ .

# Stage 2: Production
FROM node:20-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=builder /app/budolpay-0.1.0/packages/database /app/budolpay-0.1.0/packages/database
COPY --from=builder /app/budolAccounting-0.1.0 /app/budolAccounting-0.1.0

WORKDIR /app/budolAccounting-0.1.0
EXPOSE 8005
CMD ["node", "index.js"]
