
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.vercel
dotenv.config({ path: '.env.vercel' });

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function testShippingPersistence() {
    console.log('--- Testing Shipping Data Persistence ---');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'NOT FOUND');
    console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('_')));

    try {
        // 1. Find a test user and address
        const user = await prisma.user.findFirst({
            where: { email: { contains: 'tony' } } // Assuming tony is a test user
        });

        if (!user) {
            console.error('Test user not found');
            return;
        }

        const address = await prisma.address.findFirst({
            where: { userId: user.id }
        });

        if (!address) {
            console.error('Test address not found');
            return;
        }

        const product = await prisma.product.findFirst();
        if (!product) {
            console.error('No products found to create an order');
            return;
        }

        // 2. Simulate Order Data with Lalamove
        const orderData = {
            userId: user.id,
            addressId: address.id,
            storeId: product.storeId,
            paymentMethod: 'COD',
            shippingCost: 150,
            shipping: {
                provider: 'lalamove',
                cost: 150,
                quoteId: 'test-quote-123',
                serviceType: 'MOTORCYCLE'
            },
            orderItems: [
                {
                    productId: product.id,
                    quantity: 1,
                    price: product.price
                }
            ],
            total: product.price + 150
        };

        console.log('Creating order with shipping data:', JSON.stringify(orderData.shipping, null, 2));

        // 3. Create the order using Prisma directly (simulating ordersService)
        const order = await prisma.order.create({
            data: {
                userId: orderData.userId,
                addressId: orderData.addressId,
                storeId: orderData.storeId,
                status: 'ORDER_PLACED',
                paymentMethod: orderData.paymentMethod,
                shippingCost: orderData.shippingCost,
                shipping: orderData.shipping,
                total: orderData.total,
                isPaid: false,
                paymentStatus: 'pending',
                orderItems: {
                    create: orderData.orderItems.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            }
        });

        console.log('Order created successfully. ID:', order.id);

        // 4. Verify the stored data
        const savedOrder = await prisma.order.findUnique({
            where: { id: order.id }
        });

        console.log('Verified Saved Shipping Data:', JSON.stringify(savedOrder.shipping, null, 2));

        if (savedOrder.shipping && savedOrder.shipping.provider === 'lalamove') {
            console.log('SUCCESS: Shipping provider correctly persisted as "lalamove"');
        } else {
            console.error('FAILURE: Shipping provider was not correctly persisted');
        }

        // Clean up
        // await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
        // await prisma.order.delete({ where: { id: order.id } });
        // console.log('Cleanup complete');

    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testShippingPersistence();
