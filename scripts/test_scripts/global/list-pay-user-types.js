const { PrismaClient } = require('./budolpay-0.1.0/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function listUserTypes() {
  console.log('--- Current Users and Types in budolPay ---');
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        kycStatus: true,
        kycTier: true
      }
    });

    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.table(users.map(u => ({
        Name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'N/A',
        Email: u.email,
        Role: u.role,
        'KYC Status': u.kycStatus,
        'KYC Tier': u.kycTier
      })));
    }
  } catch (err) {
    console.error('Error fetching users:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

listUserTypes();
