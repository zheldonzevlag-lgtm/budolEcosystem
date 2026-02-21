// Test Script for Enhanced Checkout Session (Phase 2)
// Validates the new checkout session management features

import { PrismaClient } from '@prisma/client';
import { 
    createCheckoutSession, 
    getCheckoutSession, 
    updateCheckoutSession,
    markCheckoutAsPaid,
    markCheckoutAsFailed,
    expireCheckoutSession,
    cleanupExpiredUserSessions,
    getCheckoutStats,
    CHECKOUT_CONFIG
} from '../budolshap-0.1.0/lib/services/checkoutService.js';

const prisma = new PrismaClient();

async function testEnhancedCheckoutSession() {
    console.log('🧪 Starting Enhanced Checkout Session Tests...\n');
    
    try {
        // Test 1: Create checkout session
        console.log('Test 1: Creating checkout session...');
        const userId = 'test-user-' + Date.now();
        const checkout = await createCheckoutSession({
            userId,
            total: 1500.00,
            currency: 'PHP',
            metadata: {
                orderIds: ['order-1', 'order-2'],
                paymentMethod: 'gcash',
                storeName: 'Test Store'
            }
        });
        
        console.log(`✅ Created session: ${checkout.id}`);
        console.log(`   - Status: ${checkout.status}`);
        console.log(`   - Total: ${checkout.total}`);
        console.log(`   - Expires at: ${checkout.expiresAt}`);
        console.log(`   - Session ID: ${checkout.sessionId}\n`);
        
        // Test 2: Get checkout session
        console.log('Test 2: Retrieving checkout session...');
        const retrievedCheckout = await getCheckoutSession(checkout.id, userId);
        
        if (retrievedCheckout && retrievedCheckout.id === checkout.id) {
            console.log(`✅ Successfully retrieved session: ${retrievedCheckout.id}`);
            console.log(`   - Status: ${retrievedCheckout.status}`);
            console.log(`   - User ID: ${retrievedCheckout.userId}\n`);
        } else {
            throw new Error('Failed to retrieve checkout session');
        }
        
        // Test 3: Update checkout session
        console.log('Test 3: Updating checkout session...');
        const updatedCheckout = await updateCheckoutSession(checkout.id, {
            status: 'PROCESSING',
            metadata: JSON.stringify({ ...JSON.parse(checkout.metadata), updated: true })
        });
        
        console.log(`✅ Updated session: ${updatedCheckout.id}`);
        console.log(`   - New status: ${updatedCheckout.status}`);
        console.log(`   - Attempt count: ${updatedCheckout.attemptCount}\n`);
        
        // Test 4: Mark as paid
        console.log('Test 4: Marking checkout as paid...');
        const paidCheckout = await markCheckoutAsPaid(
            checkout.id, 
            'paymongo-intent-12345', 
            'paymongo'
        );
        
        console.log(`✅ Marked as paid: ${paidCheckout.id}`);
        console.log(`   - Status: ${paidCheckout.status}`);
        console.log(`   - Payment ID: ${paidCheckout.paymentId}`);
        console.log(`   - Paid at: ${paidCheckout.paidAt}\n`);
        
        // Test 5: Create another session and mark as failed
        console.log('Test 5: Testing failure scenario...');
        const failedCheckout = await createCheckoutSession({
            userId,
            total: 2000.00,
            currency: 'PHP'
        });
        
        const failedResult = await markCheckoutAsFailed(
            failedCheckout.id,
            'Payment declined by provider'
        );
        
        console.log(`✅ Marked as failed: ${failedResult.id}`);
        console.log(`   - Status: ${failedResult.status}`);
        console.log(`   - Failure reason: ${failedResult.failureReason}\n`);
        
        // Test 6: Get checkout statistics
        console.log('Test 6: Getting checkout statistics...');
        const stats = await getCheckoutStats(userId);
        
        console.log(`✅ Checkout statistics:`);
        console.log(`   - Total checkouts: ${stats.totalCheckouts}`);
        console.log(`   - Total amount: ${stats.totalAmount}`);
        console.log(`   - Status breakdown:`, stats.statusBreakdown);
        console.log();
        
        // Test 7: Session expiration (simulate)
        console.log('Test 7: Testing session expiration...');
        const expiringCheckout = await createCheckoutSession({
            userId,
            total: 1000.00,
            currency: 'PHP'
        });
        
        // Manually expire the session for testing
        const expiredCheckout = await expireCheckoutSession(expiringCheckout.id);
        
        console.log(`✅ Expired session: ${expiredCheckout.id}`);
        console.log(`   - Status: ${expiredCheckout.status}`);
        console.log(`   - Expired at: ${expiredCheckout.expiredAt}\n`);
        
        // Test 8: Cleanup expired sessions
        console.log('Test 8: Testing expired session cleanup...');
        const cleanedCount = await cleanupExpiredUserSessions(userId);
        
        console.log(`✅ Cleaned up ${cleanedCount} expired sessions\n`);
        
        console.log('🎉 All Enhanced Checkout Session Tests Completed Successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testEnhancedCheckoutSession().catch(console.error);