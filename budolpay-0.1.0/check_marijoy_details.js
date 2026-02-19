
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'marijoy@omsmpc.com';
  console.log(`Checking user ${email} in budolpay DB...`);
  
  const user = await prisma.user.findUnique({
    where: { email }
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
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
