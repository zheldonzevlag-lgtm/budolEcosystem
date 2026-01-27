const { prisma } = require('./budolpay-0.1.0/packages/database');

async function main() {
  const apps = await prisma.ecosystemApp.findMany();
  console.log('--- Ecosystem Apps in DB ---');
  apps.forEach(app => {
    console.log(`Name: ${app.name}`);
    console.log(`API Key: ${app.apiKey}`);
    console.log(`Redirect URI: ${app.redirectUri}`);
    console.log('---');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
