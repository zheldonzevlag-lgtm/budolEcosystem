/**
 * Test script to simulate a Lalamove webhook with driver information
 * This helps verify that the webhook handler correctly saves driver data
 * 
 * Usage: node scripts/test-lalamove-webhook.js <orderId> <bookingId>
 */

const bookingId = process.argv[2] || '337836734055B635789';
const event = process.argv[3] || 'ON_GOING';

if (!bookingId) {
    console.log('Usage: node scripts/test-lalamove-webhook.js <bookingId> [event]');
    console.log('Example: node scripts/test-lalamove-webhook.js 337836734055B635789 ON_GOING');
    console.log('\nAvailable events: ASSIGNING_DRIVER, ON_GOING, PICKED_UP, COMPLETED');
    process.exit(1);
}

// Sample webhook payload with driver information
const webhookPayload = {
    eventType: event,
    data: {
        order: {
            orderId: bookingId
        },
        status: event,
        driver: {
            name: "Test Driver 34567",
            phone: "+639171234567",
            plateNumber: "ABC1234",
            vehicleType: "Van",
            rating: 4.8,
            photo: "https://example.com/driver-photo.jpg",
            driverId: "driver_test_34567"
        },
        location: {
            lat: 14.5995,
            lng: 120.9842
        },
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString() // 30 minutes from now
    }
};

console.log('\n📤 Simulating Lalamove Webhook...\n');
console.log('Booking ID:', bookingId);
console.log('Event:', event);
console.log('\nPayload:');
console.log(JSON.stringify(webhookPayload, null, 2));

console.log('\n🌐 To send this webhook, run:');
console.log('\ncurl -X POST https://budolshap.vercel.app/api/webhooks/lalamove \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -H "x-lalamove-signature: YOUR_SIGNATURE" \\');
console.log(`  -d '${JSON.stringify(webhookPayload)}'`);

console.log('\n💡 Note: You need to generate a valid HMAC signature for the webhook to be accepted.');
console.log('The webhook handler will verify the signature using LALAMOVE_WEBHOOK_SECRET.\n');

// Also show what the database update should look like
console.log('\n📊 Expected Database Update:');
console.log('order.shipping.driver = {');
console.log('  name: "Test Driver 34567",');
console.log('  phone: "+639171234567",');
console.log('  plateNumber: "ABC1234",');
console.log('  vehicleType: "Van",');
console.log('  rating: 4.8,');
console.log('  photo: "https://example.com/driver-photo.jpg",');
console.log('  driverId: "driver_test_34567"');
console.log('};\n');
