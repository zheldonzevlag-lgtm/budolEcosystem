import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const keepEmails = [
    'tony.stark@budolshap.com',
    'peter.parker@budolshap.com',
    'reynaldomgalvez@gmail.com'
  ];

  console.log(`🚀 Starting database cleanup in budolPay...`);
  console.log(`Keeping users: ${keepEmails.join(', ')}`);

  // 1. Delete all activity logs and child records first (due to FK constraints)
  console.log('Deleting Disputes...');
  await prisma.dispute.deleteMany({});

  console.log('Deleting LedgerEntries...');
  await prisma.ledgerEntry.deleteMany({});

  console.log('Deleting Transactions...');
  await prisma.transaction.deleteMany({});

  console.log('Deleting Sessions...');
  await prisma.session.deleteMany({});

  console.log('Deleting AuditLogs...');
  await prisma.auditLog.deleteMany({});

  console.log('Deleting VerificationDocuments...');
  await prisma.verificationDocument.deleteMany({});

  // 2. Find users to delete
  const usersToDelete = await prisma.user.findMany({
    where: {
      NOT: {
        email: { in: keepEmails }
      }
    }
  });

  const userIdsToDelete = usersToDelete.map(u => u.id);
  console.log(`Found ${userIdsToDelete.length} users to delete.`);

  // 3. Delete Wallets of users to be deleted
  console.log('Deleting Wallets of non-essential users...');
  await prisma.wallet.deleteMany({
    where: {
      userId: { in: userIdsToDelete }
    }
  });

  // 4. Delete the Users
  console.log('Deleting non-essential Users...');
  await prisma.user.deleteMany({
    where: {
      id: { in: userIdsToDelete }
    }
  });

  // 5. Reset Wallets of remaining users (Optional but usually clean)
  console.log('Resetting balances for remaining users...');
  await prisma.wallet.updateMany({
    where: {
      user: {
        email: { in: keepEmails }
      }
    },
    data: {
      balance: 0.0
    }
  });

  console.log('✅ Database cleanup completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
