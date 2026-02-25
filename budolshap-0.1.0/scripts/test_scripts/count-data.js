const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const productCount = await prisma.product.count();
    console.log(`Product Count: ${productCount}`);

    const userCount = await prisma.user.count();
    console.log(`User Count: ${userCount}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
