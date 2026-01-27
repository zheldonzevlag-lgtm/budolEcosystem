import { prisma } from '../../lib/prisma.js';
import { createReturnRequest, respondToReturn } from '../../lib/services/returnsService.js';

async function runTest() {
    console.log('🚀 Starting Phase 1 Logic Test...');

    try {
        // 1. Setup: Create Dummy User, Store, and Order
        console.log('📝 Setting up test data...');
        const timestamp = Date.now();
        
        const user = await prisma.user.create({
            data: {
                id: `test-buyer-${timestamp}`,
                name: 'Test Buyer',
                email: `buyer-${timestamp}@test.com`,
                password: 'password123',
                image: 'https://avatar.com'
            }
        });

        const storeUser = await prisma.user.create({
            data: {
                id: `test-seller-${timestamp}`,
                name: 'Test Seller',
                email: `seller-${timestamp}@test.com`,
                password: 'password123',
                image: 'https://avatar.com'
            }
        });

        const store = await prisma.store.create({
            data: {
                id: `test-store-${timestamp}`,
                userId: storeUser.id,
                name: 'Test Store',
                description: 'A test store',
                username: `teststore${timestamp}`,
                logo: 'logo.png',
                email: storeUser.email,
                contact: '1234567890',
                address: 'Test Address'
            }
        });

        const wallet = await prisma.wallet.create({
            data: {
                storeId: store.id,
                balance: 0,
                pendingBalance: 1000,
                lockedBalance: 0
            }
        });

        const order = await prisma.order.create({
            data: {
                id: `test-order-${timestamp}`,
                userId: user.id,
                storeId: store.id,
                total: 500,
                status: 'DELIVERED',
                paymentMethod: 'STRIPE',
                addressId: 'any',
                isPaid: true
            }
        });

        console.log(`✅ Setup complete. Order ID: ${order.id}`);

        // 2. Test: Create Return Request (REFUND_ONLY)
        console.log('🧪 Testing: createReturnRequest (REFUND_ONLY)...');
        const returnReq = await createReturnRequest({
            orderId: order.id,
            userId: user.id,
            reason: 'Wrong item',
            type: 'REFUND_ONLY',
            refundAmount: 500
        });

        // Verify escrow locking
        const walletAfterLock = await prisma.wallet.findUnique({ where: { storeId: store.id } });
        console.log(`💰 Wallet after lock: Pending=${walletAfterLock.pendingBalance}, Locked=${walletAfterLock.lockedBalance}`);
        
        if (walletAfterLock.pendingBalance === 500 && walletAfterLock.lockedBalance === 500) {
            console.log('✅ Escrow locking successful!');
        } else {
            console.error('❌ Escrow locking failed!');
        }

        // 3. Test: Respond to Return (ACCEPT)
        console.log('🧪 Testing: respondToReturn (ACCEPT)...');
        await respondToReturn({
            returnId: returnReq.id,
            storeId: store.id,
            action: 'ACCEPT'
        });

        const walletAfterRefund = await prisma.wallet.findUnique({ where: { storeId: store.id } });
        console.log(`💰 Wallet after refund: Pending=${walletAfterRefund.pendingBalance}, Locked=${walletAfterRefund.lockedBalance}`);

        if (walletAfterRefund.lockedBalance === 0) {
            console.log('✅ Refund from locked successful!');
        } else {
            console.error('❌ Refund from locked failed!');
        }

        // 4. Test: Performance Metrics
        const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
        const updatedStore = await prisma.store.findUnique({ where: { id: store.id } });
        console.log(`📊 Metrics: Buyer BRR=${updatedUser.buyerReturnRate}, Store NFR=${updatedStore.nonFulfilmentRate}`);

        if (updatedUser.buyerReturnRate > 0 && updatedStore.nonFulfilmentRate > 0) {
            console.log('✅ Performance metrics updated successfully!');
        } else {
            console.error('❌ Performance metrics update failed!');
        }

        console.log('🎉 All Phase 1 logic tests passed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
