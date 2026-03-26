// @budolpay/database - inlined for standalone deployment
// This is a copy of the workspace package for Vercel deployment
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

// NOTE: Schema isolation removed to allow raw queries to work against the shared public schema.
// Both budolshap and payment-gateway-service share the same Vercel Postgres instance.
// PgTransaction table exists in the 'public' schema.
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // Remove any existing schema= parameter to ensure public schema access
  const baseUrl = url.split('?')[0];
  const params = new URLSearchParams(url.split('?')[1] || '');
  params.delete('schema'); // Use default 'public' schema
  const paramStr = params.toString();
  return paramStr ? `${baseUrl}?${paramStr}` : baseUrl;
};

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = { prisma, PrismaClient };
