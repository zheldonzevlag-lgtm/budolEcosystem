const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'reynaldomgalvez@gmail.com';
  
  try {
    console.log(`Searching for ${email} in all schemas...`);
    
    // List all tables named User with their columns
    const tables = await prisma.$queryRaw`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'User';
    `;
    console.log('All tables named "User":', tables);

    for (const table of tables) {
      console.log(`--- Checking ${table.table_schema}.${table.table_name} ---`);
      try {
        const columns = await prisma.$queryRawUnsafe(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'User' AND table_schema = '${table.table_schema}';
        `);
        const colNames = columns.map(c => c.column_name);
        console.log(`Columns: ${colNames.join(', ')}`);

        // Select available columns
        const selectCols = colNames.filter(c => ['id', 'email', 'role', 'firstName', 'lastName', 'isAdmin', 'name'].includes(c));
        const query = `SELECT ${selectCols.map(c => `"${c}"`).join(', ')} FROM "${table.table_schema}"."${table.table_name}" WHERE email = $1`;
        
        const results = await prisma.$queryRawUnsafe(query, email);
        console.log(`Results for ${email}:`, results);
      } catch (e) {
        console.log(`Error checking ${table.table_schema}.${table.table_name}:`, e.message);
      }
    }

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
