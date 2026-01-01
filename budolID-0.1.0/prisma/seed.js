const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apps = [
    { name: 'budolPay', apiKey: 'bp_key_2025', redirectUri: 'http://192.168.1.24:3000/api/auth/callback' },
    { name: 'budolShap', apiKey: 'bs_key_2025', redirectUri: 'http://192.168.1.24:3001/api/auth/sso/callback' },
    { name: 'budolExpress', apiKey: 'be_key_2025', redirectUri: 'http://192.168.1.24:3002/api/auth/sso/callback' }
  ];

  for (const app of apps) {
    await prisma.ecosystemApp.upsert({
      where: { name: app.name },
      update: { 
        redirectUri: app.redirectUri,
        apiKey: app.apiKey
      },
      create: {
        name: app.name,
        redirectUri: app.redirectUri,
        apiKey: app.apiKey,
        apiSecret: require('crypto').randomBytes(32).toString('hex')
      }
    });
  }

  console.log('Ecosystem apps seeded in budolID');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
