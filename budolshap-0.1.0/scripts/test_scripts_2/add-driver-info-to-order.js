/**
 * Script to manually add driver information to a completed Lalamove order
 * This simulates what would have been captured during active delivery
 * 
 * Usage: node scripts/add-driver-info-to-order.js <orderId>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const orderId = process.argv[2];

if (!orderId) {
    console.log('Usage: node scripts/add-driver-info-to-order.js <orderId>');
    console.log('Example: node scripts/add-driver-info-to-order.js cmirwejfw003jm04ee7yw8rk');
    process.exit(1);
}

// Sample driver data (you can modify this)
const sampleDriverData = {
    name: "Test Driver 34567",
    phone: "+639171234567",
    plateNumber: "ABC1234",
    vehicleType: "Van",
    rating: 4.8,
    photo: null,
    driverId: "driver_12345"
};

async function addDriverInfo() {
    try {
        console.log(`\n🔍 Looking for order: ${orderId}...`);

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                shipping: true
            }
        });

        if (!order) {
            console.log(`❌ Order ${orderId} not found`);
            return;
        }

        if (order.shipping?.provider !== 'lalamove') {
            console.log(`❌ Order ${orderId} is not a Lalamove order`);
            return;
        }

        console.log(`✅ Found Lalamove order: ${orderId}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Lalamove Status: ${order.shipping?.status || 'N/A'}`);

        // Update shipping with driver info
        const updatedShipping = {
            ...order.shipping,
            driver: sampleDriverData,
            updatedAt: new Date().toISOString()
        };

        await prisma.order.update({
            where: { id: orderId },
            data: {
                shipping: updatedShipping
            }
        });

        console.log(`\n✅ Driver information added successfully!`);
        console.log(`\nDriver Details:`);
        console.log(`  Name: ${sampleDriverData.name}`);
        console.log(`  Phone: ${sampleDriverData.phone}`);
        console.log(`  Vehicle: ${sampleDriverData.vehicleType}`);
        console.log(`  Plate: ${sampleDriverData.plateNumber}`);
        console.log(`  Rating: ${sampleDriverData.rating}`);

        console.log(`\n🌐 View the order at:`);
        console.log(`   https://budolshap.vercel.app/orders/${orderId}`);
        console.log(`\n💡 Refresh the page to see the driver information card!\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

addDriverInfo();
