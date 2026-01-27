const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const email = 'galvezjon59@gmail.com';
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        kycStatus: true,
        isActive: true,
        passwordHash: true // To check if it exists
      }
    });

    if (user) {
      console.log('User found:');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log(`User with email ${email} not found.`);
      
      // List all users to see who IS there
      const allUsers = await prisma.user.findMany({
        take: 5,
        select: { email: true }
      });
      console.log('First 5 users in DB:');
      allUsers.forEach(u => console.log(`- ${u.email}`));
    }
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
