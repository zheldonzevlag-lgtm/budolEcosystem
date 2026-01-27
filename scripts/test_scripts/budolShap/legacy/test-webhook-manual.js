/**
 * Manual Webhook Test Script
 * 
 * This script simulates a Lalamove DRIVER_ASSIGNED webhook event
 * to test if the driver information is properly saved to the database.
 * 
 * Usage:
 * 1. Update the ORDER_ID with your actual order ID
 * 2. Run: node test-webhook-manual.js
 * 3. Check the order page to see if driver info appears
 */

const crypto = require('crypto');

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

// Your Budolshap order ID (from database)
const ORDER_ID = 'cmit4cuag0002jx04sbzql9ox';

// Your Lalamove booking ID (from order.shipping.bookingId)
const LALAMOVE_BOOKING_ID = '3379141263827092112';

// Your webhook URL (production or local)
const WEBHOOK_URL = 'https://budulshap.vercel.app/api/shipping/lalamove/webhook';
// For local testing, use: 'http://localhost:3000/api/shipping/lalamove/webhook'

// Your Lalamove webhook secret (from .env)
const WEBHOOK_SECRET = process.env.LALAMOVE_WEBHOOK_SECRET || 'your-webhook-secret-here';

// ============================================
// WEBHOOK PAYLOAD - Based on actual Lalamove format
// ============================================

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

// ============================================
// GENERATE SIGNATURE
// ============================================

function generateSignature(payload, secret) {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    return hmac.update(payloadString).digest('hex');
}

// ============================================
// SEND WEBHOOK
// ============================================

async function sendTestWebhook() {
    console.log('='.repeat(80));
    console.log('🧪 MANUAL WEBHOOK TEST');
    console.log('='.repeat(80));
    console.log('');
    console.log('Configuration:');
    console.log('  Order ID:', ORDER_ID);
    console.log('  Lalamove Booking ID:', LALAMOVE_BOOKING_ID);
    console.log('  Webhook URL:', WEBHOOK_URL);
    console.log('');
    console.log('Payload:');
    console.log(JSON.stringify(webhookPayload, null, 2));
    console.log('');

    const signature = generateSignature(webhookPayload, WEBHOOK_SECRET);
    console.log('Generated Signature:', signature);
    console.log('');

    try {
        console.log('Sending webhook...');
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Lalamove-Signature': signature,
                'User-Agent': 'Lalamove-Webhook-Test/1.0'
            },
            body: JSON.stringify(webhookPayload)
        });

        console.log('');
        console.log('Response Status:', response.status, response.statusText);

        const responseData = await response.json();
        console.log('Response Body:', JSON.stringify(responseData, null, 2));
        console.log('');

        if (response.ok) {
            console.log('✅ Webhook sent successfully!');
            console.log('');
            console.log('Next steps:');
            console.log('1. Wait a few seconds for processing');
            console.log('2. Check your order page: https://budulshap.vercel.app/orders/' + ORDER_ID);
            console.log('3. Driver information should now be visible');
            console.log('');
            console.log('Or run this command to check the database:');
            console.log('  node view-shipping-data.js');
        } else {
            console.log('❌ Webhook failed!');
            console.log('Check the error message above for details.');
        }

    } catch (error) {
        console.error('');
        console.error('❌ Error sending webhook:', error.message);
        console.error('');
        console.error('Possible issues:');
        console.error('1. Network connection problem');
        console.error('2. Invalid webhook URL');
        console.error('3. Server is down');
        console.error('');
        console.error('Full error:', error);
    }

    console.log('');
    console.log('='.repeat(80));
}

// ============================================
// ALTERNATIVE: Test with actual Lalamove API
// ============================================

async function testWithLalamoveAPI() {
    console.log('='.repeat(80));
    console.log('🔄 TRIGGER REAL WEBHOOK FROM LALAMOVE');
    console.log('='.repeat(80));
    console.log('');
    console.log('To trigger a real webhook from Lalamove:');
    console.log('');
    console.log('Option 1: Lalamove Partner Portal');
    console.log('  1. Go to: https://partnerportal.lalamove.com/developers/webhooks');
    console.log('  2. Find the DRIVER_ASSIGNED event for order:', LALAMOVE_BOOKING_ID);
    console.log('  3. Click "Resend" button');
    console.log('');
    console.log('Option 2: Create a new test order');
    console.log('  1. Go to your Budolshap site');
    console.log('  2. Place a new order with Lalamove delivery');
    console.log('  3. Wait for driver assignment');
    console.log('');
    console.log('Option 3: Use this script to simulate webhook');
    console.log('  Run: node test-webhook-manual.js send');
    console.log('');
    console.log('='.repeat(80));
}

// ============================================
// MAIN
// ============================================

const args = process.argv.slice(2);
const command = args[0];

if (command === 'send') {
    sendTestWebhook();
} else if (command === 'help') {
    testWithLalamoveAPI();
} else {
    console.log('');
    console.log('📋 Lalamove Webhook Test Script');
    console.log('');
    console.log('Usage:');
    console.log('  node test-webhook-manual.js send    - Send test webhook');
    console.log('  node test-webhook-manual.js help    - Show how to trigger real webhook');
    console.log('');
    console.log('Before running:');
    console.log('  1. Update ORDER_ID in this script');
    console.log('  2. Update LALAMOVE_BOOKING_ID in this script');
    console.log('  3. Set LALAMOVE_WEBHOOK_SECRET in your .env file');
    console.log('');
    console.log('Current configuration:');
    console.log('  Order ID:', ORDER_ID);
    console.log('  Lalamove Booking ID:', LALAMOVE_BOOKING_ID);
    console.log('  Webhook URL:', WEBHOOK_URL);
    console.log('  Webhook Secret:', WEBHOOK_SECRET ? '***' + WEBHOOK_SECRET.slice(-4) : 'NOT SET');
    console.log('');
}
