// Cron Job for Expired Checkout Cleanup
// This script runs periodically to clean up expired checkout sessions

import { PrismaClient } from '@prisma/client';
import { cleanupExpiredSessions, CHECKOUT_CONFIG } from '../lib/services/checkoutService.js';

const prisma = new PrismaClient();

/**
 * Main cleanup function
 */
async function runCleanup() {
    console.log('🧹 Starting expired checkout cleanup...');
    
    try {
        const startTime = Date.now();
        
        // Run the cleanup
        const cleanedCount = await cleanupExpiredSessions();
        
        const duration = Date.now() - startTime;
        
        console.log(`✅ Cleanup completed in ${duration}ms`);
        console.log(`🧹 Cleaned up ${cleanedCount} expired checkout sessions`);
        
        // Log statistics
        const stats = await getCleanupStats();
        console.log(`📊 Cleanup Statistics:`);
        console.log(`   - Total active checkouts: ${stats.activeCheckouts}`);
        console.log(`   - Total expired checkouts: ${stats.expiredCheckouts}`);
        console.log(`   - Total paid checkouts: ${stats.paidCheckouts}`);
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Get cleanup statistics
 */
async function getCleanupStats() {
    try {
        const [activeCheckouts, expiredCheckouts, paidCheckouts] = await Promise.all([
            prisma.checkout.count({ where: { status: 'PENDING' } }),
            prisma.checkout.count({ where: { status: 'EXPIRED' } }),
            prisma.checkout.count({ where: { status: 'PAID' } })
        ]);
        
        return {
            activeCheckouts,
            expiredCheckouts,
            paidCheckouts
        };
    } catch (error) {
        console.error('❌ Failed to get cleanup stats:', error);
        return { activeCheckouts: 0, expiredCheckouts: 0, paidCheckouts: 0 };
    }
}

/**
 * Run cleanup if this script is executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    runCleanup();
}

export { runCleanup, getCleanupStats };