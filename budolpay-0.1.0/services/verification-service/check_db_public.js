const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); // Default is public

async function main() {
  const userId = '188c6152-7a29-48fc-a307-2115f5b14b2a';
  console.log(`Checking public documents for user: ${userId}`);
  
  try {
    const docs = await prisma.verificationDocument.findMany({
      where: { userId }
    });
    console.log('--- PUBLIC DOCUMENTS ---');
    console.log(JSON.stringify(docs, null, 2));
    console.log('------------------------');
  } catch (e) {
    console.log('Public table likely does not exist or error:', e.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
