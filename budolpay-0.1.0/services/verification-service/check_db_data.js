const { PrismaClient } = require('@prisma/client');
const url = process.env.DATABASE_URL;
const schemaUrl = url + (url.includes('?') ? '&' : '?') + 'schema=budolpay';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: schemaUrl,
    },
  },
});

async function main() {
  const userId = '188c6152-7a29-48fc-a307-2115f5b14b2a';
  console.log(`Checking documents for user: ${userId}`);
  
  const docs = await prisma.verificationDocument.findMany({
    where: { userId }
  });
  
  console.log('--- DOCUMENTS ---');
  console.log(JSON.stringify(docs, null, 2));
  console.log('-----------------');
}

main().catch(console.error).finally(() => prisma.$disconnect());
