const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('--- Starting Admin Dashboard Query Tests ---');
  
  try {
    // 1. Test Total User Count
    console.log('Testing: prisma.user.count()...');
    const userCount = await prisma.user.count();
    console.log('Result: Total Users =', userCount);

    // 2. Test Operations Staff Count (The previously failing query)
    console.log('Testing: prisma.user.count({ where: { role: { in: ["ADMIN", "STAFF"] } } })...');
    const staffCount = await prisma.user.count({ 
      where: { 
        role: { 
          in: ['ADMIN', 'STAFF'] 
        } 
      } 
    });
    console.log('Result: Operations Staff =', staffCount);

    // 3. Test Asset Account Query
    console.log('Testing: prisma.chartOfAccount.findFirst({ where: { type: "ASSET" } })...');
    const assetAccount = await prisma.chartOfAccount.findFirst({
      where: { type: 'ASSET' },
      include: { ledgerEntries: true }
    });
    console.log('Result: Asset Account Found =', !!assetAccount);
    if (assetAccount) {
      const totalBalance = assetAccount.ledgerEntries.reduce((acc, entry) => {
        return acc + (Number(entry.debit) - Number(entry.credit));
      }, 0);
      console.log('Result: Total Ledger Balance =', totalBalance);
    }

    // 4. Test Recent Transactions Query
    console.log('Testing: prisma.transaction.findMany()...');
    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { sender: true, receiver: true }
    });
    console.log('Result: Recent Transactions Count =', recentTransactions.length);

    console.log('--- All Dashboard Queries Passed Successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('--- TEST FAILED ---');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    if (error.code) console.error('Error Code:', error.code);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();