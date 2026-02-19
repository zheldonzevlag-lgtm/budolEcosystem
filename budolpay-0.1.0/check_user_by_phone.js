
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phone = '09171234567'; // User in test_mobile_flow.js
  console.log(`Checking user with phone ${phone} in budolpay DB...`);
  
  const user = await prisma.user.findFirst({
    where: { phoneNumber: phone }
  });

  if (!user) {
    console.log('User not found.');
  } else {
    console.log('User found:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('FirstName:', user.firstName);
    console.log('LastName:', user.lastName);
    console.log('PhoneNumber:', user.phoneNumber);
    
    if (user.firstName.includes('*') || user.lastName.includes('*')) {
        console.log('⚠️ WARNING: User name is MASKED in the database! This is corrupted data.');
    } else {
        console.log('✅ User name is unmasked in database.');
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
