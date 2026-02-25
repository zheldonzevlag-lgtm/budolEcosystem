const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
  const models = [
    'User', 'Address', 'Store', 'StoreAddress', 'Product', 'Order', 'OrderItem'
  ]; // Add other models as needed

  const backupDir = path.join(__dirname, '..', 'backup-db', 'db-2026-02-24');

  for (const model of models) {
    try {
      if (prisma[model.toLowerCase()]) {
         const data = await prisma[model.toLowerCase()].findMany();
         fs.writeFileSync(
           path.join(backupDir, `${model}.json`),
           JSON.stringify(data, null, 2)
         );
         console.log(`Backed up ${model}`);
      }
    } catch (e) {
      console.error(`Failed to backup ${model}:`, e.message);
    }
  }
}

backup()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
