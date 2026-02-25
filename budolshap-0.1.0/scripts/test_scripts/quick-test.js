/**
 * Quick Test - All-in-One Testing Script
 * 
 * This script runs all verification steps in sequence:
 * 1. Sends test webhook
 * 2. Waits for processing
 * 3. Checks database
 * 4. Shows results
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Configuration
const ORDER_ID = 'cmit4cuag0002jx04sbzql9ox';
const LALAMOVE_BOOKING_ID = '3379141263827092112';
const WEBHOOK_URL = 'https://budulshap.vercel.app/api/shipping/lalamove/webhook';
const WEBHOOK_SECRET = process.env.LALAMOVE_WEBHOOK_SECRET || 'your-webhook-secret-here';

// Test webhook payload
const webhookPayload = {
    "eventID": "TEST-" + crypto.randomUUID(),
    "eventType": "DRIVER_ASSIGNED",
    "eventVersion": "v3",
    "timestamp": Date.now(),
    "data": {
        "driver": {
            "driverId": "80557",
            "phone": "+6310012345467",
            "name": "TestDriver 34567",
            "photo": "",
            "plateNumber": "VP9946964",
            "vehicleType": "MOTORCYCLE",
            "rating": 4.8
        },
        "location": {
            "lng": 114.15004381376369,
            "lat": 22.329804362923516
        },
        "order": {
            "orderId": LALAMOVE_BOOKING_ID
        },
        "metadata": {
            "orderId": ORDER_ID,
            "platform": "budolshap"
        }
    }
};

function generateSignature(payload, secret) {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    return hmac.update(payloadString).digest('hex');
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendWebhook() {
    console.log('📤 Step 1: Sending test webhook...');

    const signature = generateSignature(webhookPayload, WEBHOOK_SECRET);

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Lalamove-Signature': signature,
                'User-Agent': 'Lalamove-Webhook-Test/1.0'
            },
            body: JSON.stringify(webhookPayload)
        });

        const responseData = await response.json();

        if (response.ok) {
            console.log('   ✅ Webhook sent successfully');
            console.log('   Response:', JSON.stringify(responseData, null, 2));
            return true;
        } else {
            console.log('   ❌ Webhook failed');
            console.log('   Status:', response.status);
            console.log('   Response:', JSON.stringify(responseData, null, 2));
            return false;
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
        return false;
    }
}

async function checkDatabase() {
    console.log('\n🔍 Step 3: Checking database...');

    try {
        const order = await prisma.order.findUnique({
            where: { id: ORDER_ID },
            select: {
                id: true,
                status: true,
                shipping: true,
                updatedAt: true
            }
        });

        if (!order) {
            console.log('   ❌ Order not found');
            return false;
        }

        console.log('   Order ID:', order.id);
        console.log('   Status:', order.status);
        console.log('   Last Updated:', order.updatedAt);
        console.log('');

        // Check driver data
        if (order.shipping?.driver) {
            console.log('   ✅ DRIVER DATA FOUND:');
            console.log('      Name:', order.shipping.driver.name);
            console.log('      Phone:', order.shipping.driver.phone);
            console.log('      Plate:', order.shipping.driver.plateNumber);
            console.log('      Vehicle:', order.shipping.driver.vehicleType);
            console.log('      Rating:', order.shipping.driver.rating);
        } else {
            console.log('   ❌ NO DRIVER DATA');
        }

        console.log('');

        // Check location data
        if (order.shipping?.location) {
            console.log('   ✅ LOCATION DATA FOUND:');
            console.log('      Lat:', order.shipping.location.lat);
            console.log('      Lng:', order.shipping.location.lng);
            console.log('      Updated:', order.shipping.location.updatedAt);
        } else {
            console.log('   ❌ NO LOCATION DATA');
        }

        return !!(order.shipping?.driver && order.shipping?.location);

    } catch (error) {
        console.log('   ❌ Database error:', error.message);
        return false;
    }
}

async function showResults(success) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(80));
    console.log('');

    if (success) {
        console.log('✅ SUCCESS! Driver information is working correctly!');
        console.log('');
        console.log('Next steps:');
        console.log('1. View the order page:');
        console.log('   https://budulshap.vercel.app/orders/' + ORDER_ID);
        console.log('');
        console.log('2. Verify the UI displays:');
        console.log('   - Driver name and photo');
        console.log('   - Phone number with call button');
        console.log('   - Vehicle type and plate number');
        console.log('   - Driver rating');
        console.log('   - GPS location');
        console.log('   - Live tracking map');
    } else {
        console.log('❌ FAILED! Driver information is not being saved.');
        console.log('');
        console.log('Troubleshooting:');
        console.log('1. Check Vercel logs:');
        console.log('   https://vercel.com/budolshap/logs');
        console.log('');
        console.log('2. Verify webhook endpoint:');
        console.log('   ' + WEBHOOK_URL);
        console.log('');
        console.log('3. Check webhook secret:');
        console.log('   LALAMOVE_WEBHOOK_SECRET=' + (WEBHOOK_SECRET ? '***' + WEBHOOK_SECRET.slice(-4) : 'NOT SET'));
        console.log('');
        console.log('4. Review the webhook payload structure');
    }

    console.log('');
    console.log('='.repeat(80));
}

async function runTest() {
    console.log('');
    console.log('='.repeat(80));
    console.log('🧪 LALAMOVE DRIVER INFO - QUICK TEST');
    console.log('='.repeat(80));
    console.log('');
    console.log('Configuration:');
    console.log('  Order ID:', ORDER_ID);
    console.log('  Lalamove Booking ID:', LALAMOVE_BOOKING_ID);
    console.log('  Webhook URL:', WEBHOOK_URL);
    console.log('');

    try {
        // Step 1: Send webhook
        const webhookSent = await sendWebhook();

        if (!webhookSent) {
            await showResults(false);
            return;
        }

        // Step 2: Wait for processing
        console.log('\n⏳ Step 2: Waiting for webhook processing (3 seconds)...');
        await sleep(3000);

        // Step 3: Check database
        const success = await checkDatabase();

        // Step 4: Show results
        await showResults(success);

    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
runTest();
