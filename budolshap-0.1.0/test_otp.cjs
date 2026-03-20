const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const records = await prisma.verificationCode.findMany();
    console.log("OTP RECORDS:", JSON.stringify(records, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
