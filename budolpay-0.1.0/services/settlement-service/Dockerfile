FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate --schema=../../packages/database/prisma/schema.prisma

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 8005
CMD ["node", "index.js"]
