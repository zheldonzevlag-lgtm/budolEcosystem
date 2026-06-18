require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '&schema=budolpay'
    }
  }
});

async function testLogin() {
    const email = 'ivarhanestad@gmail.com';
    const password = 'B@$t@rd!';
    
    console.log(`Testing login for ${email}...`);
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
        console.log('User not found!');
        return;
    }
    console.log('User found:', user.email, 'Role:', user.role);
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password is valid:', isValid);
}

testLogin().finally(() => prisma.$disconnect());
