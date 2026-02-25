import { PrismaClient } from '@prisma/client-custom-v4';
const prisma = new PrismaClient();

async function main() {
  const updatedSettings = await prisma.systemSettings.update({
    where: { id: 'default' },
    data: {
      smtpPass: 'ajwpodmhoqbhahkd',
      smtpUser: 'reynaldomgalvez@gmail.com',
      smtpFrom: 'reynaldomgalvez@gmail.com',
    }
  });
  console.log('Final System Settings in Database:');
  console.log(JSON.stringify(updatedSettings, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
