const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBalance() {
    const email = 'test@example.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { wallet: true }
    });

    if (!user) {
        console.log(`User ${email} not found in budolpay DB`);
        return;
    }

    console.log(`User ${email} found:`, user.id);
    if (!user.wallet) {
        console.log('No wallet found for this user. Creating with 1000...');
        await prisma.wallet.create({
            data: {
                userId: user.id,
                balance: 1000,
                currency: 'PHP'
            }
        });
    } else if (Number(user.wallet.balance) < 100) {
        console.log(`Current balance ${user.wallet.balance} is low. Topping up to 1000...`);
        await prisma.wallet.update({
            where: { userId: user.id },
            data: { balance: 1000 }
        });
    } else {
        const w = user.wallet;
        console.log(`Wallet: ${w.id}, Balance: ${w.balance}, Currency: ${w.currency}`);
    }
    await prisma.$disconnect();
}

checkBalance();
