const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const order = await prisma.order.findUnique({
        where: { id: 'cmj9rwxrk001sf4o448kr7mjs' },
        include: {
            store: {
                include: {
                    user: true
                }
            }
        }
    });

    if (!order) {
        console.log('Order not found');
        return;
    }

    console.log(`Order: ${order.id}`);
    console.log(`Store: ${order.store.name} (ID: ${order.store.id})`);
    console.log(`Owner: ${order.store.user.email} (ID: ${order.store.user.id})`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
