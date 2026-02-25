import { PrismaClient } from '@prisma/client-custom-v4';
const prisma = new PrismaClient();

async function check() {
    try {
        const products = await prisma.product.findMany({
            where: { storeId: 'cmjq9lbwh0001gpe0tj4xfue7' }
        });
        console.log(`Store cmjq9lbwh0001gpe0tj4xfue7 has ${products.length} products:`);
        products.forEach(p => console.log(`- ${p.name} (ID: ${p.id})`));

        const orders = await prisma.order.findMany({
            where: { storeId: 'cmjq9lbwh0001gpe0tj4xfue7' },
            include: { orderItems: { include: { product: true } } }
        });
        console.log(`\nStore has ${orders.length} orders:`);
        orders.forEach(o => {
            console.log(`Order ${o.id}: Items: ${o.orderItems.map(i => i.product?.name).join(', ')}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
