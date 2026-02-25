/**
 * Verification Script for Phase 2: QRPH & Payment Proof
 * This script verifies the status transitions and database relations
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyPhase2() {
    console.log('--- Phase 2: QRPH & Payment Proof Verification ---');

    try {
        // 1. Setup Mock Data
        let user = await prisma.user.findFirst();
        if (!user) {
            console.log('No user found, creating test user...');
            const timestamp = Date.now();
            user = await prisma.user.create({
                data: {
                    id: `user_${timestamp}`,
                    name: 'Test Buyer',
                    email: `buyer_${timestamp}@test.com`,
                    password: 'password123',
                    image: 'https://example.com/buyer.jpg',
                    accountType: 'BUYER'
                }
            });
        }

        let store = await prisma.store.findFirst();
        if (!store) {
            console.log('No store found, creating test store...');
            const timestamp = Date.now();
            const seller = await prisma.user.create({
                data: {
                    id: `seller_${timestamp}`,
                    name: 'Test Seller',
                    email: `seller_${timestamp}@test.com`,
                    password: 'password123',
                    image: 'https://example.com/seller.jpg',
                    accountType: 'SELLER'
                }
            });
            store = await prisma.store.create({
                data: {
                    id: `store_${timestamp}`,
                    name: 'Test Store',
                    ownerId: seller.id,
                    username: `teststore_${timestamp}`
                }
            });
        }

        let address = await prisma.address.findFirst({ where: { userId: user.id } });
        if (!address) {
            console.log('No address found for user, creating test address...');
            try {
                address = await prisma.address.create({
                    data: {
                        userId: user.id,
                        name: 'Home',
                        email: user.email,
                        street: '123 Main St',
                        barangay: 'Test Barangay',
                        city: 'Manila',
                        state: 'Metro Manila',
                        zip: '1000',
                        country: 'Philippines',
                        phone: '09123456789'
                    }
                });
            } catch (addrError) {
                console.error('Failed to create address:', addrError);
                throw addrError;
            }
        }

        console.log('Creating mock order...');
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                storeId: store.id,
                addressId: address.id,
                total: 250.50,
                status: 'ORDER_PLACED',
                isPaid: false,
                paymentMethod: 'QRPH'
            }
        });
        console.log(`Order created: #${order.id}`);

        // 2. Simulate Buyer Upload Proof
        console.log('\n--- Step 2: Simulating Buyer Upload Proof ---');
        await prisma.$transaction([
            prisma.paymentProof.upsert({
                where: { orderId: order.id },
                update: {
                    imageUrl: 'https://example.com/receipt.jpg',
                    refNumber: 'REF123456',
                    notes: 'Paid via GCash QR',
                    status: 'PENDING'
                },
                create: {
                    orderId: order.id,
                    imageUrl: 'https://example.com/receipt.jpg',
                    refNumber: 'REF123456',
                    notes: 'Paid via GCash QR',
                    status: 'PENDING'
                }
            }),
            prisma.order.update({
                where: { id: order.id },
                data: { status: 'PENDING_VERIFICATION' }
            })
        ]);

        let updatedOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: { paymentProof: true }
        });

        if (updatedOrder.status === 'PENDING_VERIFICATION' && updatedOrder.paymentProof?.status === 'PENDING') {
            console.log('SUCCESS: Order status updated to PENDING_VERIFICATION');
            console.log('SUCCESS: PaymentProof record created and linked.');
        } else {
            console.error('FAILURE: Proof upload simulation failed.', { status: updatedOrder.status, proof: updatedOrder.paymentProof?.status });
        }

        // 3. Simulate Admin Approval
        console.log('\n--- Step 3: Simulating Admin Approval ---');
        await prisma.$transaction([
            prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'PAID',
                    isPaid: true
                }
            }),
            prisma.paymentProof.update({
                where: { orderId: order.id },
                data: { status: 'APPROVED' }
            })
        ]);

        updatedOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: { paymentProof: true }
        });

        if (updatedOrder.status === 'PAID' && updatedOrder.isPaid && updatedOrder.paymentProof?.status === 'APPROVED') {
            console.log('SUCCESS: Admin approval worked. Status: PAID, isPaid: true.');
        } else {
            console.error('FAILURE: Admin approval simulation failed.', { status: updatedOrder.status, isPaid: updatedOrder.isPaid });
        }

        // 4. Simulate Admin Rejection (Resetting for rejection test)
        console.log('\n--- Step 4: Simulating Admin Rejection (Scenario) ---');
        // Resetting to PENDING_VERIFICATION for rejection test
        await prisma.order.update({ where: { id: order.id }, data: { status: 'PENDING_VERIFICATION', isPaid: false } });

        await prisma.$transaction([
            prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'ORDER_PLACED',
                    isPaid: false
                }
            }),
            prisma.paymentProof.update({
                where: { orderId: order.id },
                data: {
                    status: 'REJECTED',
                    notes: 'Receipt image is blurry.'
                }
            })
        ]);

        updatedOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: { paymentProof: true }
        });

        if (updatedOrder.status === 'ORDER_PLACED' && !updatedOrder.isPaid && updatedOrder.paymentProof?.status === 'REJECTED') {
            console.log('SUCCESS: Admin rejection worked. Status reverted to ORDER_PLACED.');
        } else {
            console.error('FAILURE: Admin rejection simulation failed.', { status: updatedOrder.status, isPaid: updatedOrder.isPaid });
        }

        // Cleanup
        console.log('\nCleaning up mock data...');
        await prisma.paymentProof.delete({ where: { orderId: order.id } });
        await prisma.order.delete({ where: { id: order.id } });
        console.log('Done.');

    } catch (error) {
        console.error('Verification failed:', error.message || error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyPhase2();
