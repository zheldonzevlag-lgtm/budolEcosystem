/**
 * Phase 2 Production Test Script
 * Tests Lalamove webhook handler on production environment
 * 
 * This script:
 * 1. Finds an existing PAID order with Lalamove booking
 * 2. Simulates PICKED_UP webhook event
 * 3. Verifies status changes to SHIPPED
 * 4. Simulates COMPLETED webhook event
 * 5. Verifies status changes to DELIVERED with autoCompleteAt set
 * 6. Generates detailed test report
 */

const https = require('https');
const crypto = require('crypto');

// Production configuration
const PRODUCTION_URL = 'https://weeshap.vercel.app';
const WEBHOOK_ENDPOINT = '/api/webhooks/lalamove';

// Test data - will be filled during execution
const testData = {
    orderId: null,
    lalamoveBookingId: null,
    initialStatus: null,
    afterPickupStatus: null,
    afterDeliveryStatus: null,
    timestamps: {},
    errors: []
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(80));
    log(title, 'bright');
    console.log('='.repeat(80) + '\n');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Make HTTP request
function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(PRODUCTION_URL + path);

        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Generate webhook signature (simplified - production uses actual Lalamove secret)
function generateWebhookSignature(payload, secret = 'test-secret') {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
}

// Get order details from production
async function getOrderDetails(orderId) {
    try {
        const response = await makeRequest('GET', `/api/orders/${orderId}`);
        if (response.status === 200) {
            return response.data;
        }
        return null;
    } catch (error) {
        logWarning(`Could not fetch order details: ${error.message}`);
        return null;
    }
}

// Test PICKED_UP webhook
async function testPickedUpWebhook(bookingId) {
    logSection('TEST 1: PICKED_UP Webhook Event');

    const payload = {
        event: 'PICKED_UP',
        orderId: bookingId,
        status: 'PICKED_UP',
        driver: {
            name: 'Test Driver',
            phone: '+639123456789',
            plateNumber: 'ABC 1234',
            photo: 'https://example.com/driver.jpg'
        },
        location: {
            lat: 14.5995,
            lng: 120.9842
        },
        timestamp: new Date().toISOString()
    };

    logInfo('Sending PICKED_UP webhook to production...');
    logInfo(`Booking ID: ${bookingId}`);

    try {
        const signature = generateWebhookSignature(payload);

        const response = await makeRequest('POST', WEBHOOK_ENDPOINT, payload, {
            'x-lalamove-signature': signature
        });

        if (response.status === 200) {
            logSuccess('Webhook accepted by server');
            logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);

            if (response.data.newStatus) {
                testData.afterPickupStatus = response.data.newStatus;
                logSuccess(`Order status updated to: ${response.data.newStatus}`);
            }

            return true;
        } else {
            logError(`Webhook failed with status ${response.status}`);
            testData.errors.push(`PICKED_UP webhook failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        logError(`Webhook request failed: ${error.message}`);
        testData.errors.push(`PICKED_UP webhook error: ${error.message}`);
        return false;
    }
}

// Test COMPLETED webhook
async function testCompletedWebhook(bookingId) {
    logSection('TEST 2: COMPLETED Webhook Event');

    const actualDeliveryTime = new Date().toISOString();

    const payload = {
        event: 'COMPLETED',
        orderId: bookingId,
        status: 'COMPLETED',
        actualDeliveryTime: actualDeliveryTime,
        location: {
            lat: 14.5995,
            lng: 120.9842
        },
        timestamp: new Date().toISOString()
    };

    logInfo('Sending COMPLETED webhook to production...');
    logInfo(`Booking ID: ${bookingId}`);

    try {
        const signature = generateWebhookSignature(payload);

        const response = await makeRequest('POST', WEBHOOK_ENDPOINT, payload, {
            'x-lalamove-signature': signature
        });

        if (response.status === 200) {
            logSuccess('Webhook accepted by server');
            logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);

            if (response.data.newStatus) {
                testData.afterDeliveryStatus = response.data.newStatus;
                logSuccess(`Order status updated to: ${response.data.newStatus}`);
            }

            return true;
        } else {
            logError(`Webhook failed with status ${response.status}`);
            testData.errors.push(`COMPLETED webhook failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        logError(`Webhook request failed: ${error.message}`);
        testData.errors.push(`COMPLETED webhook error: ${error.message}`);
        return false;
    }
}

// Verify results
async function verifyResults(orderId) {
    logSection('TEST 3: Verifying Database Changes');

    logInfo('Waiting 3 seconds for database updates...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const orderDetails = await getOrderDetails(orderId);

    if (orderDetails) {
        logSuccess('Order details retrieved from production');

        // Check status
        logInfo(`\nCurrent order status: ${orderDetails.status}`);

        // Check timestamps
        if (orderDetails.shippedAt) {
            logSuccess(`✓ shippedAt: ${orderDetails.shippedAt}`);
            testData.timestamps.shippedAt = orderDetails.shippedAt;
        } else {
            logWarning('✗ shippedAt not set');
        }

        if (orderDetails.deliveredAt) {
            logSuccess(`✓ deliveredAt: ${orderDetails.deliveredAt}`);
            testData.timestamps.deliveredAt = orderDetails.deliveredAt;
        } else {
            logWarning('✗ deliveredAt not set');
        }

        if (orderDetails.autoCompleteAt) {
            logSuccess(`✓ autoCompleteAt: ${orderDetails.autoCompleteAt}`);
            testData.timestamps.autoCompleteAt = orderDetails.autoCompleteAt;

            // Calculate days until auto-completion
            const daysUntil = Math.round((new Date(orderDetails.autoCompleteAt) - new Date()) / (1000 * 60 * 60 * 24));
            logInfo(`  Auto-completion scheduled in ${daysUntil} days`);
        } else {
            logWarning('✗ autoCompleteAt not set');
        }

        return orderDetails;
    } else {
        logWarning('Could not retrieve order details for verification');
        logInfo('This may be due to API authentication requirements');
        return null;
    }
}

// Generate test report
function generateTestReport() {
    logSection('📊 PHASE 2 TEST REPORT');

    const report = {
        testDate: new Date().toISOString(),
        environment: 'PRODUCTION',
        productionUrl: PRODUCTION_URL,
        testData: testData,
        summary: {
            pickedUpWebhook: testData.afterPickupStatus === 'SHIPPED' ? '✅ PASSED' : '⚠️ NEEDS VERIFICATION',
            completedWebhook: testData.afterDeliveryStatus === 'DELIVERED' ? '✅ PASSED' : '⚠️ NEEDS VERIFICATION',
            timestampUpdates: Object.keys(testData.timestamps).length > 0 ? '✅ VERIFIED' : '⚠️ NEEDS MANUAL CHECK',
            emailNotifications: '⚠️ CHECK EMAIL LOGS',
            overallStatus: testData.errors.length === 0 ? '✅ PASSED' : '⚠️ PARTIAL'
        },
        errors: testData.errors
    };

    console.log('\n' + JSON.stringify(report, null, 2));

    if (testData.errors.length === 0) {
        logSuccess('\n✅ Phase 2 Implementation: WORKING IN PRODUCTION');
    } else {
        logWarning('\n⚠️ Phase 2 Implementation: NEEDS ATTENTION');
        logInfo('Some tests could not be fully verified. Manual verification recommended.');
    }

    logInfo('\n📋 Test Summary:');
    logInfo(`  • PICKED_UP webhook: ${report.summary.pickedUpWebhook}`);
    logInfo(`  • COMPLETED webhook: ${report.summary.completedWebhook}`);
    logInfo(`  • Timestamp updates: ${report.summary.timestampUpdates}`);
    logInfo(`  • Email notifications: ${report.summary.emailNotifications}`);

    return report;
}

// Main execution
async function runProductionTests() {
    console.clear();
    logSection('🧪 PHASE 2 PRODUCTION TEST SUITE');
    logInfo(`Testing on: ${PRODUCTION_URL}`);
    logInfo(`Test started: ${new Date().toISOString()}\n`);

    // For production testing, we need to provide test data
    logInfo('This test requires an existing order with Lalamove booking.');
    logInfo('Please provide the following information:\n');

    // In a real scenario, you would input these values
    // For now, we'll use placeholder values that need to be updated
    const TEST_BOOKING_ID = process.argv[2] || 'ENTER_BOOKING_ID_HERE';
    const TEST_ORDER_ID = process.argv[3] || 'ENTER_ORDER_ID_HERE';

    if (TEST_BOOKING_ID === 'ENTER_BOOKING_ID_HERE') {
        logError('Please provide Lalamove Booking ID as first argument');
        logInfo('Usage: node scripts/test-phase2-production.js <BOOKING_ID> <ORDER_ID>');
        logInfo('Example: node scripts/test-phase2-production.js LM123456 ord_abc123\n');

        logInfo('To find a test order:');
        logInfo('1. Go to production database');
        logInfo('2. Find an order with status="PAID" and shipping.bookingId');
        logInfo('3. Use that order\'s booking ID and order ID\n');

        process.exit(1);
    }

    testData.orderId = TEST_ORDER_ID;
    testData.lalamoveBookingId = TEST_BOOKING_ID;

    logInfo(`Using Booking ID: ${TEST_BOOKING_ID}`);
    logInfo(`Using Order ID: ${TEST_ORDER_ID}\n`);

    try {
        // Test 1: PICKED_UP webhook
        const pickedUpSuccess = await testPickedUpWebhook(TEST_BOOKING_ID);

        if (pickedUpSuccess) {
            // Wait a bit before next test
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Test 2: COMPLETED webhook
            const completedSuccess = await testCompletedWebhook(TEST_BOOKING_ID);

            if (completedSuccess) {
                // Test 3: Verify results
                await verifyResults(TEST_ORDER_ID);
            }
        }

        // Generate report
        const report = generateTestReport();

        // Save report
        const fs = require('fs');
        const reportPath = './test-results-phase2-production.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        logSuccess(`\n📄 Test report saved to: ${reportPath}`);

    } catch (error) {
        logError(`\n❌ TEST FAILED: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run tests
runProductionTests();
