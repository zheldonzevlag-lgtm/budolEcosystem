const { prisma } = require('./budolpay-0.1.0/packages/database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

async function main() {
  const email = 'galvezjon59@gmail.com';
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.error('User not found. Run seeding first.');
    return;
  }

  const app = await prisma.ecosystemApp.findFirst({ where: { name: 'budolShap' } });
  if (!app) {
    console.error('App budolShap not found. Run seeding first.');
    return;
  }

  const payload = {
    sub: user.id, // Standard for many auth systems
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  // Create session in DB
  const session = await prisma.session.upsert({
    where: { token },
    update: {
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    create: {
      userId: user.id,
      appId: app.id,
      token: token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
  console.log('--- TEST DATA GENERATED ---');
  console.log('User ID:', user.id);
  console.log('App ID:', app.id);
  console.log('Token:', token);
  console.log('--- CALLBACK URLS ---');
  console.log(`budolShap: http://${LOCAL_IP}:3001/auth/callback?token=${token}`);
  console.log(`budolPay:  http://${LOCAL_IP}:3000/api/auth/callback?token=${token}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
