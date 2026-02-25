const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrder(orderId) {
    console.log(`\n=== Checking Order: ${orderId} ===`);

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            store: true,
            address: true,
            user: true
        }
    });

    if (!order) {
        console.log('Order not found');
        return;
    }

    console.log('\nStore Details:');
    console.log('  Name:', order.store.name);
    console.log('  Contact:', order.store.contact);
    console.log('  Lat/Lng:', order.store.latitude, order.store.longitude);

    console.log('\nDelivery Address:');
    console.log('  Name:', order.address.name);
    console.log('  Phone:', order.address.phone);
    console.log('  Street:', order.address.street);
    console.log('  City:', order.address.city);
    console.log('  Lat/Lng:', order.address.latitude, order.address.longitude);

    console.log('\nUser:');
    console.log('  Name:', order.user.name);
    console.log('  Phone:', order.user.phone);

    console.log('\nShipping Info:');
    console.log('  Provider:', order.shipping?.provider);
    console.log('  QuotationId:', order.shipping?.quotationId);
    console.log('  Has Stops:', !!order.shipping?.stops);
}

async function main() {
    await checkOrder('cmikk91l7000411sr5967dqui');
    await checkOrder('cmikjigzv0008gafpnz0tnham');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
