const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(__dirname, '..', 'backup-db', 'db-2026-04-10');

async function main() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const tables = ['user', 'transaction', 'auditLog', 'wallet', 'ledgerEntry'];
  
  for (const table of tables) {
    console.log(`Backing up ${table}...`);
    try {
      const data = await prisma[table].findMany();
      fs.writeFileSync(
        path.join(BACKUP_DIR, `${table}.json`),
        JSON.stringify(data, null, 2)
      );
      console.log(`✅ ${table} backed up: ${data.length} records.`);
    } catch (error) {
      console.error(`❌ Failed to backup ${table}:`, error.message);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
