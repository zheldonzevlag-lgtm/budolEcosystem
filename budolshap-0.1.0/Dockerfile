# BudolShap Dockerfile
# Why: Single-stage build that installs dependencies inside the container
#       to ensure native binaries (like lightningcss) are compiled for Linux.
# What: Copies source code, runs npm install (for Linux binaries), builds Next.js app.

FROM node:20-slim

WORKDIR /app

# Install system dependencies required by Prisma and native modules
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files first
COPY package*.json ./
# Copy prisma schema before install (needed for postinstall hook)
COPY prisma ./prisma

# Install dependencies for Linux (gets correct native binaries like lightningcss)
# --legacy-peer-deps: bypass peer dependency conflicts (e.g. onnxruntime-web)
RUN npm install --legacy-peer-deps

# Copy the rest of the source code
COPY . .

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Provide a dummy DATABASE_URL for the build phase (prevents Prisma initialization errors during prerendering)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]