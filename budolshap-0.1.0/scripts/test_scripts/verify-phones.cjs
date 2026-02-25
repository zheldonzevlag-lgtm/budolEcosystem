const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emails = ['reynaldomgalvez@gmail.com', 'tony.stark@budolshap.com', 'peter.parker@budolshap.com'];
prisma.user.findMany({ 
  where: { email: { in: emails } }, 
  select: { email: true, phoneNumber: true } 
}).then(users => { 
  console.log('budolShap:', users); 
  process.exit(0); 
});
