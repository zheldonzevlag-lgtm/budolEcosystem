require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

// Use PRISMA_DATABASE_URL if DATABASE_URL is not the Postgres one
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('mysql')) {
    process.env.DATABASE_URL = process.env.PRISMA_DATABASE_URL;
}

const prisma = new PrismaClient();

async function injectDriverData() {
    const orderId = 'cmisl1hbs0003js04ncr6j24x';

    // Driver data from the webhook screenshot
    const driverData = {
        name: "TestDriver 34567",
        phone: "+631001234567",
        plateNumber: "VPM946964",
        vehicleType: "MOTORCYCLE",
        photo: "",
        rating: null,
        driverId: "80557"
    };

    const locationData = {
        lat: "22.329804362935516",
        lng: "114.15903381376369",
        updatedAt: new Date().toISOString()
    };

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { shipping: true }
        });

        if (!order) {
            console.log('Order not found!');
            return;
        }

        const updatedShipping = {
            ...order.shipping,
            driver: driverData,
            location: locationData,
            updatedAt: new Date().toISOString()
        };

        await prisma.order.update({
            where: { id: orderId },
            data: { shipping: updatedShipping }
        });

        console.log('✅ Driver data injected successfully!');
        console.log('Driver:', driverData);
        console.log('Location:', locationData);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

injectDriverData();
