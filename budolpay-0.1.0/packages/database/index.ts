import { PrismaClient } from '@prisma/client'

export * from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const dbUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0 
  ? process.env.DATABASE_URL 
  : "postgresql://postgres:postgres@localhost:5432/budolpay?schema=public";

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: dbUrl
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
