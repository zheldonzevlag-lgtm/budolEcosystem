import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const userCount = await prisma.user.count();
        const storeCount = await prisma.store.count();
        const orderCount = await prisma.order.count();

        console.log(`CHECK_RESULT: Users: ${userCount}`);
        console.log(`CHECK_RESULT: Stores: ${storeCount}`);
        console.log(`CHECK_RESULT: Orders: ${orderCount}`);
    } catch (error) {
        if (error.code === 'P2021') {
            console.log('CHECK_RESULT: Tables do not exist (DB might be empty or uninitialized).');
        } else {
            console.error('CHECK_RESULT: Error checking DB:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
