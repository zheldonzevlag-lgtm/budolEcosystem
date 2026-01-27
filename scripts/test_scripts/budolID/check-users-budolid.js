const { prisma } = require('@budolpay/database');

async function main() {
    console.log('--- Users in budolid Database ---');
    const users = await prisma.user.findMany({
        select: { id: true, email: true, phoneNumber: true, firstName: true, lastName: true }
    });
    console.table(users);
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
