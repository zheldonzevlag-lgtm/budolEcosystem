const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function main() {
  const localIP = process.env.LOCAL_IP || '192.168.1.2';
  const apps = [
    { name: 'budolPay', apiKey: 'bp_key_2025', redirectUri: `http://${localIP}:3000/api/auth/callback` },
    { name: 'budolShap', apiKey: 'bs_key_2025', redirectUri: `http://${localIP}:3001/api/auth/sso/callback` },
    { name: 'budolExpress', apiKey: 'be_key_2025', redirectUri: `http://${localIP}:3002/api/auth/sso/callback` }
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
