require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.lalamove' });
const { PrismaClient } = require('@prisma/client');
const Lalamove = require('../../services/lalamove');

// Hardcode DB URL
process.env.DATABASE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhY2NlbGVyYXRlX3VybCI6Imh0dHBzOi8vYWNjZWxlcmF0ZS5wcmlzbWEtZGF0YS5uZXQiLCJhcGlfa2V5IjoiY2FjaGVfcHJveHlfY29ubmVjdGlvbl9wb29sX2NsYWl0X2NsaWVudF9pZF9jb25uZWN0aW9uX3N0cmluZyJ9";

const prisma = new PrismaClient();
const lalamove = new Lalamove();

async function diagnose() {
    try {
        // Find the most recent Lalamove order
        const orders = await prisma.order.findMany({
            where: {
                shipping: {
                    path: ['provider'],
                    equals: 'lalamove'
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 3
        });

        console.log(`\n=== Found ${orders.length} recent Lalamove orders ===\n`);

        for (const order of orders) {
            console.log(`\n--- Order ID: ${order.id} ---`);
            console.log(`Status: ${order.status}`);
            console.log(`Created: ${order.createdAt}`);

            const shipping = order.shipping || {};
            console.log(`\nShipping Data in DB:`);
            console.log(`  Provider: ${shipping.provider}`);
            console.log(`  Booking ID: ${shipping.bookingId}`);
            console.log(`  Status: ${shipping.status}`);
            console.log(`  Driver in DB: ${shipping.driver ? JSON.stringify(shipping.driver, null, 2) : 'NULL'}`);
            console.log(`  Share Link: ${shipping.shareLink || 'NULL'}`);

            if (shipping.bookingId) {
                console.log(`\nFetching from Lalamove API...`);
                try {
                    const apiResult = await lalamove.trackOrder(shipping.bookingId);
                    console.log(`\nAPI Result:`);
                    console.log(`  Status: ${apiResult.status}`);
                    console.log(`  Driver from API: ${apiResult.driver ? JSON.stringify(apiResult.driver, null, 2) : 'NULL'}`);
                    console.log(`  Share Link: ${apiResult.shareLink || 'NULL'}`);
                    console.log(`  Location: ${apiResult.location ? JSON.stringify(apiResult.location, null, 2) : 'NULL'}`);
                } catch (error) {
                    console.error(`  API Error: ${error.message}`);
                }
            }
            console.log(`\n${'='.repeat(60)}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
