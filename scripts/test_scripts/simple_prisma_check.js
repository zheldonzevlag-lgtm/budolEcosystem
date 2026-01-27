try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  console.log('Prisma loaded successfully');
  console.log('User model exists:', !!prisma.user);
  console.log('AuditLog model exists:', !!prisma.auditLog);
  prisma.$disconnect();
} catch (e) {
  console.error('Failed to load Prisma:', e.message);
}
