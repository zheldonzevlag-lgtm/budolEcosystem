require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '&schema=budolpay'
    }
  }
});
prisma.user.findUnique({where: {email: 'ivarhanestad@gmail.com'}}).then(u => {
    console.log('HASH:', u.passwordHash);
}).finally(() => prisma.$disconnect());
