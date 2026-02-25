import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('🔍 Checking users, stores, and orders...\n');

        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true }
        });
        console.log('--- Users ---');
        users.forEach(u => console.log(`[${u.id}] ${u.name} (${u.email})`));

        const stores = await prisma.store.findMany({
            include: { user: true }
        });
        console.log('\n--- Stores ---');
        stores.forEach(s => console.log(`[${s.id}] ${s.name} - Owner: ${s.user.name} (${s.user.id})`));

        const orders = await prisma.order.findMany({
            include: {
                user: true,
                store: true
            }
        });
        console.log('\n--- Orders ---');
        orders.forEach(o => {
            console.log(`[${o.id}] Store: ${o.store.name} (${o.storeId}) - Buyer: ${o.user.name} (${o.userId}) - Status: ${o.status}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

check();
