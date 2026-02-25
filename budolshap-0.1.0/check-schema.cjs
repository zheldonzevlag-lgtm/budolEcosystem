const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSystemSettingsSchema() {
  try {
    console.log('Checking SystemSettings schema...');
    
    // Try to run a raw SQL query to see the table structure
    const result = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'SystemSettings'`;
    console.log('SystemSettings columns:');
    console.log(result);
    
    // Try to find any existing settings
    const settings = await prisma.$queryRaw`SELECT * FROM "SystemSettings" LIMIT 1`;
    console.log('\nExisting settings (if any):');
    console.log(settings);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Try alternative approach - check if table exists
    try {
      const tableExists = await prisma.$queryRaw`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'SystemSettings')`;
      console.log('Table exists:', tableExists);
    } catch (e) {
      console.error('Could not check table existence:', e.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkSystemSettingsSchema();