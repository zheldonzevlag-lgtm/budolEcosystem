# BudolShap Single-Stage Dockerfile (Fast Build)
# Purpose: Direct build using local node_modules to avoid npm install failures
FROM node:20-slim

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy everything (including local node_modules)
COPY . .

# Generate Prisma client for Linux (replaces Windows binary)
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]