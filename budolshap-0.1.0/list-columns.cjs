const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listColumns() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'SystemSettings'
      ORDER BY column_name;
    `;
    console.log('Columns in SystemSettings:');
    console.table(columns);
  } catch (error) {
    console.error('Error listing columns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listColumns();