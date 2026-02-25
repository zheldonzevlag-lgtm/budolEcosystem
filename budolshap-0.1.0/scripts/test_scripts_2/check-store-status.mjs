import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const stores = await prisma.store.findMany();
        stores.forEach(s => {
            console.log(`Store: ${s.name} [${s.id}] Status: ${s.status} Active: ${s.isActive}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
