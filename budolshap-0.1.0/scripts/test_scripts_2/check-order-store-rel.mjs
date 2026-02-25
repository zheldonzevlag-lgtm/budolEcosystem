import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const orderCount = await prisma.order.count();
        console.log(`Total orders in DB: ${orderCount}`);

        const orders = await prisma.order.findMany({
            include: {
                store: true,
                user: true
            }
        });

        orders.forEach(o => {
            console.log(`Order ${o.id}: Store [${o.storeId}] ${o.store.name}, Buyer [${o.userId}] ${o.user.name}, Status ${o.status}`);
        });

        const storeOwners = await prisma.store.findMany({
            include: { user: true }
        });
        storeOwners.forEach(s => {
            console.log(`Store [${s.id}] ${s.name} owned by [${s.userId}] ${s.user.name}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
