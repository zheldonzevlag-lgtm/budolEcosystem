const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSystemSettingsTable() {
  try {
    console.log('🔍 Checking SystemSettings table columns...');
    
    // Check if the column exists
    const checkColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'SystemSettings' AND column_name = 'swrPollingInterval';
    `;

    if (checkColumn.length === 0) {
      console.log('➕ Column swrPollingInterval is missing. Adding it...');
      await prisma.$executeRaw`
        ALTER TABLE "SystemSettings" ADD COLUMN "swrPollingInterval" INTEGER DEFAULT 10000;
      `;
      console.log('✅ Column swrPollingInterval added successfully.');
    } else {
      console.log('ℹ️ Column swrPollingInterval already exists.');
    }

    // Also check for other potential missing columns based on the schema
    const columnsToAdd = [
      { name: 'sessionTimeout', type: 'INTEGER', default: '15' },
      { name: 'sessionWarning', type: 'INTEGER', default: '1' },
      { name: 'loginLimit', type: 'INTEGER', default: '10' },
      { name: 'registerLimit', type: 'INTEGER', default: '5' },
      { name: 'cacheProvider', type: 'TEXT', default: "'MEMORY'" },
      { name: 'marketingAdsEnabled', type: 'BOOLEAN', default: 'false' },
      { name: 'quickInstallerEnabled', type: 'BOOLEAN', default: 'true' },
      { name: 'adDisplayMode', type: 'TEXT', default: "'SEQUENCE'" },
      { name: 'errorTrackingEnabled', type: 'BOOLEAN', default: 'false' },
      { name: 'orderCancellationHours', type: 'INTEGER', default: '48' },
      { name: 'orderCancellationEnabled', type: 'BOOLEAN', default: 'true' },
      { name: 'protectionWindowDays', type: 'INTEGER', default: '3' },
      { name: 'budolShapShippingEnabled', type: 'BOOLEAN', default: 'false' },
      { name: 'budolShapShippingSLADays', type: 'INTEGER', default: '3' },
      { name: 'budolShapWaybillGeneration', type: 'BOOLEAN', default: 'false' },
      { name: 'mapProvider', type: 'TEXT', default: "'OSM'" },
      { name: 'emailProvider', type: 'TEXT', default: "'GOOGLE'" }
    ];

    for (const col of columnsToAdd) {
      const checkCol = await prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'SystemSettings' AND column_name = '${col.name}';
      `);

      if (checkCol.length === 0) {
        console.log(`➕ Column ${col.name} is missing. Adding it...`);
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "SystemSettings" ADD COLUMN "${col.name}" ${col.type} DEFAULT ${col.default};
        `);
        console.log(`✅ Column ${col.name} added successfully.`);
      }
    }

    console.log('🚀 Database schema check completed.');

  } catch (error) {
    console.error('❌ Error fixing SystemSettings table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSystemSettingsTable();