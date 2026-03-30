const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

// BudolPay Schema Isolation Logic (v5.0.5)
// Ensures the client always targets the 'budolpay' schema to avoid collisions with budolShap
const getIsolatingUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url || url.length === 0) {
    // Fallback for build-time static optimization on Vercel
    return "postgresql://postgres:postgres@localhost:5432/budolpay?schema=budolpay";
  }
  
  // If it already has a schema specified, respect it (unless it's public)
  if (url.includes('schema=budolpay')) return url;
  
  // Force budolpay schema if it's pointing to public or has no schema
  const baseUrl = url.split('?')[0];
  const params = new URLSearchParams(url.split('?')[1] || '');
  params.set('schema', 'budolpay');
  
  return `${baseUrl}?${params.toString()}`;
};

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getIsolatingUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const auth = require('./auth');
const rbac = require('./rbac-config');

module.exports = {
  prisma,
  PrismaClient,
  ...auth,
  ...rbac
};
