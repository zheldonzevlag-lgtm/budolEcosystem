
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'reynaldomgalvez@gmail.com';
  const newPassword = 'tr@1t0r';

  console.log(`Updating user ${email}...`);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        accountType: 'ADMIN',
        isAdmin: true,
      },
    });

    console.log('User updated successfully:');
    console.log({
      id: updatedUser.id,
      email: updatedUser.email,
      accountType: updatedUser.accountType,
      isAdmin: updatedUser.isAdmin,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
