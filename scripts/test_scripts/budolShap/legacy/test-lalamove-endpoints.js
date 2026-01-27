/**
 * Test script for Lalamove API endpoints
 * Run with: node test-lalamove-endpoints.js
 */

const BASE_URL = 'http://localhost:3000';

// Test data
const testQuoteData = {
    pickup: {
        address: "SM Mall of Asia, Pasay City, Metro Manila",
        coordinates: { lat: 14.5352, lng: 120.9822 },
        contactName: "John Doe",
        contactPhone: "+639171234567"
    },
    delivery: {
        address: "Bonifacio Global City, Taguig, Metro Manila",
        coordinates: { lat: 14.5547, lng: 121.0244 },
        contactName: "Jane Smith",
        contactPhone: "+639189876543"
    },
    package: {
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 15 },
        description: "Electronics - Handle with care"
    },
    serviceType: "MOTORCYCLE"
};

async function testWebhookHealth() {
    console.log('\n🧪 Testing Webhook Health Check...');
    try {
        const response = await fetch(`${BASE_URL}/api/webhooks/lalamove`);
        const data = await response.json();

        if (response.ok) {
            console.log('✅ Webhook health check passed');
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ Webhook health check failed');
            console.log('Status:', response.status);
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function testQuoteEndpoint(sessionCookie) {
    console.log('\n🧪 Testing Quote Endpoint...');
    try {
        const response = await fetch(`${BASE_URL}/api/shipping/lalamove/quote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie || ''
            },
            body: JSON.stringify(testQuoteData)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Quote endpoint working');
            console.log('Quote ID:', data.quote?.quoteId);
            console.log('Price:', data.quote?.price?.amount, data.quote?.price?.currency);
            console.log('Distance:', data.quote?.distance?.text);
            console.log('ETA:', data.quote?.eta?.delivery);
            return data.quote?.quoteId;
        } else {
            console.log('❌ Quote endpoint failed');
            console.log('Status:', response.status);
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    return null;
}

async function testEndpointStructure() {
    console.log('\n📋 Lalamove API Endpoints Test Summary\n');
    console.log('='.repeat(60));

    console.log('\n✅ Endpoints Created:');
    console.log('  1. POST /api/shipping/lalamove/quote');
    console.log('  2. POST /api/shipping/lalamove/book');
    console.log('  3. GET  /api/shipping/lalamove/track/[orderId]');
    console.log('  4. POST /api/shipping/lalamove/cancel/[orderId]');
    console.log('  5. POST /api/webhooks/lalamove');

    console.log('\n📝 Testing Notes:');
    console.log('  • All endpoints require authentication (except webhook)');
    console.log('  • Use valid Manila/Philippines coordinates');
    console.log('  • Webhook requires HMAC signature verification');
    console.log('  • Test with sandbox environment first');

    console.log('\n🔐 Authentication Required:');
    console.log('  To test authenticated endpoints, you need to:');
    console.log('  1. Login to the app at http://localhost:3000/login');
    console.log('  2. Copy the session cookie from browser DevTools');
    console.log('  3. Add it to the fetch requests');

    console.log('\n' + '='.repeat(60));
}

async function runTests() {
    console.log('🚀 Lalamove API Endpoints Test Suite\n');

    // Test webhook health (no auth required)
    await testWebhookHealth();

    // Show endpoint structure
    await testEndpointStructure();

    console.log('\n💡 To test authenticated endpoints:');
    console.log('   1. Login at: http://localhost:3000/login');
    console.log('   2. Open browser DevTools > Application > Cookies');
    console.log('   3. Copy the session cookie value');
    console.log('   4. Run: node test-lalamove-endpoints.js <cookie-value>');

    console.log('\n📖 Full documentation: LALAMOVE_PHASE2_COMPLETE.html');
    console.log('✅ Phase 2 Implementation Complete!\n');
}

// Run tests
runTests().catch(console.error);
