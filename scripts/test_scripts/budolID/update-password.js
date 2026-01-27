const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'reynaldomgalvez@gmail.com';
  const newPassword = 'tr@1t0r';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { passwordHash: hashedPassword }
  });

  console.log(`Successfully updated password for ${updatedUser.email}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
