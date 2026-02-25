const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findData() {
    const email = 'bruce.wayne@budolshap.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { store: { include: { Product: true } } }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log(`User ID: ${user.id}`);
    if (user.store) {
        console.log(`Store ID: ${user.store.id}`);
        console.log(`Store Name: ${user.store.name}`);
        if (user.store.Product.length > 0) {
            console.log(`Product ID: ${user.store.Product[0].id}`);
            console.log(`Product Price: ${user.store.Product[0].price}`);
        } else {
            console.log('No products found');
        }
    } else {
        console.log('No store found');
    }
}

findData().finally(() => prisma.$disconnect());
