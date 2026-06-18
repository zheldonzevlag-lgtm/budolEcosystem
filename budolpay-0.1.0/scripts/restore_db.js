const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(__dirname, '..', 'backup-db', 'db-2026-04-10');

async function main() {
  const tables = ['user', 'wallet', 'transaction', 'auditLog', 'ledgerEntry'];
  
  for (const table of tables) {
    const filePath = path.join(BACKUP_DIR, `${table}.json`);
    if (!fs.existsSync(filePath)) continue;

    console.log(`Restoring ${table}...`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Use createMany if supported, or loop for safety with relations
    for (const item of data) {
      try {
        await prisma[table].create({ data: item });
      } catch (error) {
        // Silently skip duplicates if they somehow exist
        if (!error.message.includes('Unique constraint')) {
          console.error(`❌ Error restoring ${table} record:`, error.message);
        }
      }
    }
    console.log(`✅ ${table} restored.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
