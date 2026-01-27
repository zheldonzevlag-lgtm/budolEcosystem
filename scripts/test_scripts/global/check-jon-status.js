const { PrismaClient: BudolIdPrisma } = require('./budolID-0.1.0/node_modules/@prisma/client');
const { PrismaClient: BudolPayPrisma } = require('./budolpay-0.1.0/node_modules/@prisma/client');
const { PrismaClient: BudolShapPrisma } = require('./budolshap-0.1.0/node_modules/@prisma/client');

async function check() {
  const emails = ['reynaldomgalvez@gmail.com', 'galvezjon59@gmail.com'];
  const results = {};

  for (const email of emails) {
    results[email] = { budolID: 'Not Found', budolPay: 'Not Found', budolShap: 'Not Found' };

    try {
      const idPrisma = new BudolIdPrisma();
      const u = await idPrisma.user.findUnique({ where: { email } });
      if (u) results[email].budolID = `${u.role} (Status: ${u.status || 'N/A'})`;
      await idPrisma.$disconnect();
    } catch (e) { results[email].budolID = `Error: ${e.message}`; }

    try {
      const payPrisma = new BudolPayPrisma();
      const u = await payPrisma.user.findUnique({ where: { email } });
      if (u) results[email].budolPay = `${u.kycTier} (Status: ${u.kycStatus})`;
      await payPrisma.$disconnect();
    } catch (e) { results[email].budolPay = `Error: ${e.message}`; }

    try {
      const shapPrisma = new BudolShapPrisma();
      const u = await shapPrisma.user.findUnique({ where: { email } });
      if (u) results[email].budolShap = `${u.accountType} (Admin: ${u.isAdmin})`;
      await shapPrisma.$disconnect();
    } catch (e) { results[email].budolShap = `Error: ${e.message}`; }
  }

  console.table(results);
}

check().catch(console.error);
