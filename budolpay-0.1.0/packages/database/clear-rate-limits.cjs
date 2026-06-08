require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '&schema=budolpay'
    }
  }
});
prisma.rateLimit.deleteMany({}).then(c => console.log('Cleared', c.count, 'rate limits')).finally(() => prisma.$disconnect());
