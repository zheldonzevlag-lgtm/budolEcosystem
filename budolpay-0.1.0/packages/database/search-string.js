const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const searchTerm = 'Reynaldo';
  
  try {
    console.log(`Searching for "${searchTerm}" in all tables and schemas...`);
    
    // Get all schemas
    const schemas = await prisma.$queryRaw`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog');
    `;
    console.log('Schemas:', schemas.map(s => s.schema_name));

    for (const schema of schemas) {
      const schemaName = schema.schema_name;
      const tables = await prisma.$queryRawUnsafe(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schemaName}';
      `);

      for (const table of tables) {
        const tableName = table.table_name;
        try {
          const columns = await prisma.$queryRawUnsafe(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '${tableName}' AND table_schema = '${schemaName}' AND data_type IN ('text', 'character varying');
          `);

          if (columns.length === 0) continue;

          const conditions = columns.map(c => `"${c.column_name}" ILIKE $1`).join(' OR ');
          const query = `SELECT * FROM "${schemaName}"."${tableName}" WHERE ${conditions}`;
          
          const results = await prisma.$queryRawUnsafe(query, `%${searchTerm}%`);
          if (results.length > 0) {
            console.log(`[MATCH] ${schemaName}.${tableName}:`, results);
          }
        } catch (e) {
          // Skip errors for specific tables
        }
      }
    }

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
