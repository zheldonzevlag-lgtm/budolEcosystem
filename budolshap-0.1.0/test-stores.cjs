
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Testing Store table in BudolShap...');
  try {
    const storeCount = await prisma.store.count();
    console.log('Total Stores in DB:', storeCount);
    
    if (storeCount > 0) {
      const stores = await prisma.store.findMany({ take: 5 });
      console.log('Sample Stores:', JSON.stringify(stores, null, 2));
    } else {
      console.warn('Store table is EMPTY!');
    }
  } catch (error) {
    console.error('Error fetching stores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
