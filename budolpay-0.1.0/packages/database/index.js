const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const auth = require('./auth');
const rbac = require('./rbac-config');

module.exports = {
  prisma,
  PrismaClient,
  ...auth,
  ...rbac
};
