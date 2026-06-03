import { PrismaClient } from '@prisma/client'

export * from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const rawDbUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0 
  ? process.env.DATABASE_URL 
  : "postgresql://postgres:postgres@localhost:5432/budolpay";

// Ensure the connection uses "budolpay" schema
function ensureBudolpaySchema(url: string): string {
  if (url.includes('schema=')) {
    return url.replace(/schema=[^&]+/, 'schema=budolpay');
  }
  if (url.includes('?')) {
    return `${url}&schema=budolpay`;
  }
  return `${url}?schema=budolpay`;
}

const dbUrl = ensureBudolpaySchema(rawDbUrl);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
