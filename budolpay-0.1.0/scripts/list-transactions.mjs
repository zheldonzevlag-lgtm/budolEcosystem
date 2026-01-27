import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const transactions = await prisma.transaction.findMany({
    include: {
      sender: true,
      receiver: true
    }
  });
  console.log(`Found ${transactions.length} transactions:`);
  transactions.forEach(tx => {
    console.log(`- ID: ${tx.id} | Amount: ${tx.amount} | Type: ${tx.type} | Status: ${tx.status}`);
    console.log(`  Sender: ${tx.sender?.email || 'N/A'} -> Receiver: ${tx.receiver?.email || 'N/A'}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
