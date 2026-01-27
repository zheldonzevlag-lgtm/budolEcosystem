const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'reynaldomgalvez@gmail.com';
  const passwordToVerify = 'tr@1t0r';
  
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  const isMatch = await bcrypt.compare(passwordToVerify, user.passwordHash);
  if (isMatch) {
    console.log(`✅ SUCCESS: Password for ${email} is correctly set to ${passwordToVerify}`);
  } else {
    console.log(`❌ FAILURE: Password for ${email} does NOT match.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
