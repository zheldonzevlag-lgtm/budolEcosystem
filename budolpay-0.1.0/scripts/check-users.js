const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany({
        include: { wallet: true }
    });
    console.log('Users in database:');
    users.forEach(u => {
        console.log(`- ${u.email} (ID: ${u.id}, Role: ${u.role}, Balance: ${u.wallet ? u.wallet.balance : 'No Wallet'})`);
    });
    process.exit(0);
}

checkUsers();
