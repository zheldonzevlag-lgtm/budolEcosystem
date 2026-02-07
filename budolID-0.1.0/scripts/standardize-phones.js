
const { PrismaClient } = require('../generated/client');

function normalizePhilippinePhone(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let digits = phone.replace(/[^0-9]/g, '');
  
  // Handle different formats
  if (digits.startsWith('0')) {
    // Local format: 09XXXXXXXXX -> +639XXXXXXXXX
    digits = '63' + digits.substring(1);
  } else if (digits.startsWith('63') && digits.length === 12) {
    // Already in 63 format
  } else if (digits.startsWith('9') && digits.length === 10) {
    // Assume Philippine number without country code
    digits = '63' + digits;
  }
  
  // Validate final format (should be 63 followed by 10 digits)
  if (/^63[0-9]{10}$/.test(digits)) {
    return '+' + digits;
  }
  
  return null;
}

async function standardizeSchema(schemaName) {
  console.log(`\n🔍 Standardizing schema: ${schemaName}`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL.replace(/schema=[^&]+/, `schema=${schemaName}`).replace(/search_path=[^&]+/, `search_path=${schemaName}`)
      }
    }
  });

  try {
    // Use raw query to fetch users to avoid model mismatch
    const users = await prisma.$queryRawUnsafe(`SELECT id, "phoneNumber", name, email FROM "${schemaName}"."User"`);
    
    console.log(`📊 Found ${users.length} users in ${schemaName}.`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      if (!user.phoneNumber) continue;
      
      const normalized = normalizePhilippinePhone(user.phoneNumber);
      
      if (normalized && normalized !== user.phoneNumber) {
        console.log(`✅ Normalizing [${user.name || user.email}]: ${user.phoneNumber} -> ${normalized}`);
        // Use raw query to update to avoid model mismatch
        await prisma.$executeRawUnsafe(
          `UPDATE "${schemaName}"."User" SET "phoneNumber" = $1 WHERE id = $2`,
          normalized,
          user.id
        );
        updatedCount++;
      }
    }
    
    console.log(`✨ ${schemaName} Complete! Updated: ${updatedCount}`);
  } catch (error) {
    console.error(`❌ Failed to standardize ${schemaName}:`, error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function migrate() {
  console.log('🚀 Starting Multi-Schema Phone Number Standardization...');
  
  await standardizeSchema('budolid');
  await standardizeSchema('public');
  
  console.log('\n🏁 All migrations finished.');
}

migrate();
