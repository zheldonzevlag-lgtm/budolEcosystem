
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupAndTest() {
    try {
        console.log('1. Cleaning up old test data...');
        // Clean up strictly by this booking ID to avoid nuking other data
        const bookingId = "3387703058699346791";

        // Create a dummy user and store if needed (assuming they exist or creating partials)
        // Simplest: Find ANY user/store to attach to, or create one.

        let user = await prisma.user.findFirst();
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: 'test-user', name: 'Test User', email: 'test@test.com', password: 'pw',
                    username: 'testuser' // if exists in your schema
                }
            });
        }

        let store = await prisma.store.findFirst();
        if (!store) {
            store = await prisma.store.create({
                data: {
                    userId: user.id, name: 'Test Store', description: 'desc',
                    username: 'teststore', address: 'addr', logo: 'logo',
                    email: 'store@test.com', contact: '123'
                }
            });
        }

        // Create the Order
        console.log('2. Creating Dummy Order...');
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                storeId: store.id,
                addressId: 'temp', // This might fail if foreign key constraint. 
                // Actually easier to just find an existing one?
                // Let's try raw SQL or standard create with minimums.
                // Assuming address exists or creating one.
                address: {
                    create: {
                        userId: user.id, name: 'Addr', street: 'Street', city: 'City',
                        state: 'State', zip: '1234', country: 'PH', phone: '123', email: 'e@e.com'
                    }
                },
                total: 100,
                paymentMethod: 'COD',
                status: 'PROCESSING',
                shipping: {
                    provider: 'lalamove',
                    bookingId: bookingId,
                    status: 'PICKED_UP'
                }
            }
        });

        console.log(`✅ Order Created: ${order.id}`);

        // 3. Simulate Webhook
        console.log('3. Simulating Webhook Request...');
        const fetch = require('node-fetch'); // Ensure node-fetch is available or use built-in fetch if Node 18+

        const payload = {
            eventType: "ORDER_STATUS_CHANGED",
            status: "CANCELED",
            orderId: bookingId, // This matches Lalamove format in screenshot
            data: {
                order: {
                    orderId: bookingId,
                    status: "CANCELED",
                    previousStatus: "PICKED_UP"
                }
            }
        };

        const response = await fetch('http://localhost:3000/api/webhooks/lalamove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`Response Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response Body: ${text}`);

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setupAndTest();
