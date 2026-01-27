/**
 * Test Script for Auto-Completion Functionality
 * Tests the auto-completion system without waiting 7 days
 * 
 * Usage: node scripts/test-auto-complete.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAutoCompletion() {
    console.log('\n' + '='.repeat(80));
    log('🧪 AUTO-COMPLETION TEST SCRIPT', 'cyan');
    console.log('='.repeat(80) + '\n');

    try {
        // Step 1: Find a DELIVERED order
        log('Step 1: Finding DELIVERED orders...', 'blue');

        const deliveredOrders = await prisma.order.findMany({
            where: {
                status: 'DELIVERED'
            },
            include: {
                user: true,
                store: true
            },
            take: 5
        });

        if (deliveredOrders.length === 0) {
            log('⚠️  No DELIVERED orders found in database', 'yellow');
            log('Please create a test order and set its status to DELIVERED first', 'yellow');
            return;
        }

        log(`✅ Found ${deliveredOrders.length} DELIVERED orders\n`, 'green');

        // Step 2: Check auto-completion dates
        log('Step 2: Checking auto-completion dates...', 'blue');

        deliveredOrders.forEach((order, index) => {
            console.log(`${index + 1}. Order: ${order.id}`);
            log(`   Status: ${order.status}`, 'cyan');
            log(`   Customer: ${order.user.email}`, 'cyan');
            log(`   Store: ${order.store.name}`, 'cyan');

            if (order.deliveredAt) {
                log(`   Delivered: ${new Date(order.deliveredAt).toLocaleString()}`, 'green');
            } else {
                log(`   Delivered: Not set`, 'yellow');
            }

            if (order.autoCompleteAt) {
                const daysUntil = Math.round((new Date(order.autoCompleteAt) - new Date()) / (1000 * 60 * 60 * 24));
                log(`   Auto-complete: ${new Date(order.autoCompleteAt).toLocaleString()}`, 'green');
                log(`   Days until: ${daysUntil}`, daysUntil <= 0 ? 'green' : 'yellow');
            } else {
                log(`   Auto-complete: Not scheduled`, 'red');
            }
            console.log('');
        });

        // Step 3: Simulate auto-completion by setting date to past
        log('Step 3: Would you like to test auto-completion?', 'blue');
        log('This will set autoCompleteAt to the past for testing purposes', 'yellow');
        log('Run the cron job endpoint to complete the orders\n', 'yellow');

        // Find orders ready for auto-completion
        const now = new Date();
        const readyOrders = await prisma.order.findMany({
            where: {
                status: 'DELIVERED',
                autoCompleteAt: {
                    lte: now
                }
            }
        });

        if (readyOrders.length > 0) {
            log(`✅ ${readyOrders.length} orders are ready for auto-completion NOW`, 'green');
            log('Run: POST http://localhost:3000/api/cron/auto-complete-orders', 'cyan');
            log('Or visit: http://localhost:3000/api/cron/auto-complete-orders in browser\n', 'cyan');
        } else {
            log('⚠️  No orders ready for auto-completion yet', 'yellow');
            log('To test, manually set autoCompleteAt to a past date in database\n', 'yellow');
        }

        // Step 4: Show SQL to manually trigger test
        log('Step 4: Manual Test Setup (Optional)', 'blue');
        log('To manually test auto-completion, run this SQL:', 'yellow');
        console.log('\n-- Set autoCompleteAt to past for testing');
        console.log('UPDATE "Order"');
        console.log('SET "autoCompleteAt" = NOW() - INTERVAL \'1 day\'');
        console.log('WHERE status = \'DELIVERED\'');
        console.log('AND id = \'YOUR_ORDER_ID_HERE\';\n');

        log('Then call the cron endpoint:', 'yellow');
        log('GET http://localhost:3000/api/cron/auto-complete-orders', 'cyan');
        log('Or: POST http://localhost:3000/api/cron/auto-complete-orders\n', 'cyan');

        // Step 5: Verify cron endpoint exists
        log('Step 5: Verifying cron endpoint...', 'blue');

        try {
            const response = await fetch('http://localhost:3000/api/cron/auto-complete-orders', {
                method: 'POST'
            });

            if (response.ok) {
                const data = await response.json();
                log('✅ Cron endpoint is accessible', 'green');
                log(`Response: ${JSON.stringify(data, null, 2)}`, 'cyan');
            } else {
                log(`⚠️  Cron endpoint returned status: ${response.status}`, 'yellow');
            }
        } catch (error) {
            log('⚠️  Could not reach cron endpoint (server may not be running)', 'yellow');
            log('Make sure dev server is running: npm run dev', 'yellow');
        }

        console.log('\n' + '='.repeat(80));
        log('✅ TEST COMPLETE', 'green');
        console.log('='.repeat(80) + '\n');

    } catch (error) {
        log(`\n❌ TEST FAILED: ${error.message}`, 'red');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run test
testAutoCompletion();
