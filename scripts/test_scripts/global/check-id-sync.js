const path = require('path');
const { PrismaClient: PrismaShap } = require(path.resolve(__dirname, 'budolshap-0.1.0', 'node_modules', '@prisma/client'));
const { PrismaClient: PrismaID } = require(path.resolve(__dirname, 'budolpay-0.1.0', 'node_modules', '@prisma/client'));

async function check() {
  const email = 'galvezjon59@gmail.com';
  
  const prismaShap = new PrismaShap({
    datasources: { db: { url: 'postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public' } }
  });
  
  const prismaID = new PrismaID({
    datasources: { db: { url: 'postgresql://postgres:r00t@localhost:5432/budolid?schema=public' } }
  });

  try {
    const userShap = await prismaShap.user.findUnique({ where: { email } });
    const userID = await prismaID.user.findUnique({ where: { email } });

    console.log('--- ID SYNC CHECK ---');
    console.log('Email:', email);
    console.log('BudolShap ID:', userShap ? userShap.id : 'NOT FOUND');
    console.log('BudolID ID:  ', userID ? userID.id : 'NOT FOUND');
    
    if (userShap && userID && userShap.id !== userID.id) {
        console.log('❌ IDs DO NOT MATCH! This will cause SSO session issues.');
    } else if (userShap && userID) {
        console.log('✅ IDs match.');
    }
    console.log('---------------------');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prismaShap.$disconnect();
    await prismaID.$disconnect();
  }
}

check();
