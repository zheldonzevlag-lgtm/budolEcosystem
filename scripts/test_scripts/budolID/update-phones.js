const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = [
  { email: 'reynaldomgalvez@gmail.com', phoneNumber: '09484099388' },
  { email: 'tony.stark@budolshap.com', phoneNumber: '09484099400' },
  { email: 'peter.parker@budolshap.com', phoneNumber: '09171854432' }
];

async function main() {
  console.log('Updating users in budolID database...');
  for (const update of updates) {
    try {
      const user = await prisma.user.findUnique({ where: { email: update.email } });
      if (user) {
        await prisma.user.update({
          where: { email: update.email },
          data: { phoneNumber: update.phoneNumber }
        });
        console.log(`Updated ${update.email} with phone ${update.phoneNumber}`);
      } else {
        console.log(`User ${update.email} not found in budolID`);
      }
    } catch (error) {
      console.error(`Error updating ${update.email}:`, error.message);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
