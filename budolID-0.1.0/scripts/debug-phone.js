const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPhone(phone) {
  console.log(`🔍 Searching for phone: ${phone}`);
  
  const rawDigits = phone.replace(/[^0-9]/g, '');
  const variations = [
    phone,
    '+63' + rawDigits.slice(-10),
    '0' + rawDigits.slice(-10),
    rawDigits.slice(-10)
  ];
  
  console.log(`Variations to check: ${variations.join(', ')}`);

  const schemas = ['budolid', 'public'];
  
  for (const schema of schemas) {
    console.log(`\nChecking schema: ${schema}`);
    try {
      const users = await prisma.$queryRawUnsafe(`SELECT id, "phoneNumber", name, email FROM "${schema}"."User"`);
      console.log(`Found ${users.length} users in ${schema}`);
      
      for (const user of users) {
        if (!user.phoneNumber) continue;
        
        const userPhoneDigits = user.phoneNumber.replace(/[^0-9]/g, '');
        const targetDigits = rawDigits.slice(-10);
        
        if (userPhoneDigits.endsWith(targetDigits)) {
          console.log(`✅ MATCH FOUND in ${schema}:`);
          console.log(JSON.stringify(user, null, 2));
        }
      }
    } catch (e) {
      console.error(`Error checking schema ${schema}: ${e.message}`);
    }
  }
}

const target = process.argv[2] || '9484099400';
checkPhone(target)
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
