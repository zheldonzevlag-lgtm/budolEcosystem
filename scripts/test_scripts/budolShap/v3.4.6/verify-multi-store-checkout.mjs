import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve dependencies from the main project directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Adjust this path to point to budolshap-0.1.0/package.json
const projectRoot = path.resolve(__dirname, '../../../../budolshap-0.1.0/package.json'); 
const require = createRequire(projectRoot);

const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../budolshap-0.1.0/.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Multi-Store Checkout Verification...');

    // 1. Setup Test Data
    const email = `test-user-${Date.now()}@example.com`;
    const userId = randomUUID();
    const user = await prisma.user.create({
        data: {
            id: userId,
            email,
            name: 'Test User',
            password: 'password123', // Dummy
            role: 'USER',
            phoneNumber: `09${Date.now().toString().slice(-9)}`,
            image: 'https://example.com/avatar.png'
        }
    });
    console.log(`✅ Created Test User: ${user.id}`);

    const store1Id = randomUUID();
    const store1 = await prisma.store.create({
        data: {
            id: store1Id,
            name: `Store 1 - ${Date.now()}`,
            description: 'Test Store 1',
            username: `store1_${Date.now()}`,
            address: '123 Test St',
            logo: 'https://example.com/logo.png',
            email: 'store1@example.com',
            contact: '09000000001',
            userId: user.id
        }
    });
    console.log(`✅ Created Store 1: ${store1.id}`);

    // Create a second user for Store 2 (since userId is unique in Store)
    const user2Id = randomUUID();
    const user2 = await prisma.user.create({
        data: {
            id: user2Id,
            email: `test-user2-${Date.now()}@example.com`,
            name: 'Test User 2',
            password: 'password123',
            role: 'USER',
            phoneNumber: `09${(Date.now() + 1).toString().slice(-9)}`,
            image: 'https://example.com/avatar2.png'
        }
    });
    console.log(`✅ Created Test User 2: ${user2.id}`);

    const store2Id = randomUUID();
    const store2 = await prisma.store.create({
        data: {
            id: store2Id,
            name: `Store 2 - ${Date.now()}`,
            description: 'Test Store 2',
            username: `store2_${Date.now()}`,
            address: '456 Test Ave',
            logo: 'https://example.com/logo2.png',
            email: 'store2@example.com',
            contact: '09000000002',
            userId: user2.id // Different owner for Store 2
        }
    });
    console.log(`✅ Created Store 2: ${store2.id}`);

    const addressId = randomUUID();
    const address = await prisma.address.create({
        data: {
            id: addressId,
            userId: user.id,
            name: 'Test User',
            email: email,
            phone: '09000000000',
            street: '123 Test St',
            barangay: 'Test Brgy',
            city: 'Test City',
            state: 'Test State',
            zip: '1000'
        }
    });
    console.log(`✅ Created Address: ${address.id}`);

    const product1 = await prisma.product.create({
        data: {
            name: 'Product 1',
            price: 100,
            mrp: 120,
            category: 'Test',
            storeId: store1.id,
            stock: 10,
            description: 'Test Product 1'
        }
    });
    console.log(`✅ Created Product 1: ${product1.id} (Stock: 10)`);

    const product2 = await prisma.product.create({
        data: {
            name: 'Product 2',
            price: 200,
            mrp: 220,
            category: 'Test',
            storeId: store2.id,
            stock: 5,
            description: 'Test Product 2'
        }
    });
    console.log(`✅ Created Product 2: ${product2.id} (Stock: 5)`);

    // 2. Simulate Order Creation (Multi-Store)
    console.log('\n📦 Simulating Order Creation (ordersService.js logic)...');
    
    // Calculate totals
    const item1Total = 100 * 2; // 2 units
    const item2Total = 200 * 1; // 1 unit
    const shippingCost = 50;
    const grandTotal = (item1Total + shippingCost) + (item2Total + shippingCost); // 2 orders, 2 shipping fees

    // Start Transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create Checkout
        const checkout = await tx.checkout.create({
            data: {
                userId: user.id,
                total: grandTotal,
                status: 'PENDING'
            }
        });

        // Create Order 1
        const order1 = await tx.order.create({
            data: {
                userId: user.id,
                storeId: store1.id,
                addressId: address.id,
                status: 'ORDER_PLACED',
                paymentMethod: 'BUDOL_PAY',
                total: item1Total + shippingCost,
                isPaid: false,
                paymentStatus: 'pending',
                checkoutId: checkout.id,
                orderItems: {
                    create: [{
                        productId: product1.id,
                        quantity: 2,
                        price: 100
                    }]
                }
            }
        });

        // Decrement Stock 1 (Atomic)
        await tx.product.update({
            where: { id: product1.id },
            data: { stock: { decrement: 2 } }
        });

        // Create Order 2
        const order2 = await tx.order.create({
            data: {
                userId: user.id,
                storeId: store2.id,
                addressId: address.id,
                status: 'ORDER_PLACED',
                paymentMethod: 'BUDOL_PAY',
                total: item2Total + shippingCost,
                isPaid: false,
                paymentStatus: 'pending',
                checkoutId: checkout.id,
                orderItems: {
                    create: [{
                        productId: product2.id,
                        quantity: 1,
                        price: 200
                    }]
                }
            }
        });

        // Decrement Stock 2 (Atomic)
        await tx.product.update({
            where: { id: product2.id },
            data: { stock: { decrement: 1 } }
        });

        return { checkout, order1, order2 };
    });

    console.log(`✅ Transaction Committed.`);
    console.log(`   Checkout ID: ${result.checkout.id}`);
    console.log(`   Order 1 ID: ${result.order1.id}`);
    console.log(`   Order 2 ID: ${result.order2.id}`);

    // Verify Stock Decrement
    const p1 = await prisma.product.findUnique({ where: { id: product1.id } });
    const p2 = await prisma.product.findUnique({ where: { id: product2.id } });
    
    if (p1.stock !== 8) throw new Error(`Product 1 stock incorrect: ${p1.stock} (expected 8)`);
    if (p2.stock !== 4) throw new Error(`Product 2 stock incorrect: ${p2.stock} (expected 4)`);
    console.log(`✅ Stock decrement verified.`);

    // 3. Simulate Webhook Payment Success
    console.log('\n💳 Simulating Payment Success (Webhook logic)...');
    
    const checkoutId = result.checkout.id;
    const paymentIntentId = `pi_${randomUUID()}`;

    // Update Checkout Status
    await prisma.checkout.update({
        where: { id: checkoutId },
        data: { 
            status: 'PAID',
            paymentId: paymentIntentId,
            paymentProvider: 'BUDOL_PAY'
        }
    });
    console.log(`✅ Checkout ${checkoutId} marked as PAID.`);

    // Find linked orders
    const linkedOrders = await prisma.order.findMany({
        where: { checkoutId: checkoutId }
    });
    console.log(`✅ Found ${linkedOrders.length} linked orders.`);

    // Update linked orders
    for (const order of linkedOrders) {
        await prisma.order.update({
            where: { id: order.id },
            data: {
                isPaid: true,
                paymentStatus: 'paid',
                status: 'TO_SHIP' // Assuming successful payment moves to TO_SHIP
            }
        });
        console.log(`   -> Order ${order.id} updated to PAID/TO_SHIP.`);
    }

    // 4. Final Verification
    console.log('\n🔍 Verifying Final State...');
    
    const finalCheckout = await prisma.checkout.findUnique({
        where: { id: checkoutId },
        include: { orders: true }
    });

    if (finalCheckout.status !== 'PAID') throw new Error('Checkout status is not PAID');
    if (finalCheckout.orders.length !== 2) throw new Error('Checkout does not have 2 orders');
    
    for (const o of finalCheckout.orders) {
        if (!o.isPaid) throw new Error(`Order ${o.id} is not marked as paid`);
        if (o.status !== 'TO_SHIP') throw new Error(`Order ${o.id} status is not TO_SHIP`);
    }

    console.log('✅ All verification checks passed!');
}

main()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
