require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrderDriverData() {
    try {
        const orderId = 'cmisptsw40002k104lbo1ovqt';

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { name: true, email: true } },
                store: { select: { name: true } },
                address: true
            }
        });

        if (!order) {
            console.log('Order not found');
            return;
        }

        console.log('\n=== ORDER DETAILS ===');
        console.log('Order ID:', order.id);
        console.log('Status:', order.status);
        console.log('Customer:', order.user.name);
        console.log('Store:', order.store.name);

        console.log('\n=== SHIPPING DATA ===');
        console.log(JSON.stringify(order.shipping, null, 2));

        if (order.shipping?.driver) {
            console.log('\n✅ DRIVER INFO FOUND:');
            console.log('Name:', order.shipping.driver.name);
            console.log('Phone:', order.shipping.driver.phone);
            console.log('Vehicle:', order.shipping.driver.vehicleType);
            console.log('Plate:', order.shipping.driver.plateNumber);
            console.log('Rating:', order.shipping.driver.rating);
        } else {
            console.log('\n❌ NO DRIVER INFO');
        }

        if (order.shipping?.location) {
            console.log('\n✅ LOCATION INFO FOUND:');
            console.log('Coordinates:', `${order.shipping.location.lat}, ${order.shipping.location.lng}`);
            console.log('Updated:', order.shipping.location.updatedAt);
        } else {
            console.log('\n❌ NO LOCATION INFO');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrderDriverData();
