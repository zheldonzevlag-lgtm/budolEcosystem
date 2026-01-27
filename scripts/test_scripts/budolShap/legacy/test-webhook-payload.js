// Test webhook payload based on Lalamove documentation
// This simulates what Lalamove sends when a driver is assigned

const testWebhookPayload = {
    "eventType": "DRIVER_ASSIGNED",
    "data": {
        "orderId": "3379143481414336609",
        "status": "ON_GOING",
        "driver": {
            "name": "Juan Dela Cruz",
            "phone": "+639171234567",
            "plateNumber": "ABC-1234",
            "vehicleType": "MOTORCYCLE",
            "photo": "https://example.com/driver-photo.jpg",
            "photoUrl": "https://example.com/driver-photo.jpg",
            "rating": 4.8,
            "driverId": "80557"
        },
        "driverLocation": {
            "lat": "14.5505000",
            "lng": "121.0260000",
            "updatedAt": new Date().toISOString()
        },
        "metadata": {
            "orderId": "cmisl1hbs0003js04ncr6j24x",
            "platform": "budolshap"
        }
    }
};

console.log('Expected webhook payload structure:');
console.log(JSON.stringify(testWebhookPayload, null, 2));

// To test this, you would POST this to:
// https://budolshap.vercel.app/api/shipping/lalamove/webhook

console.log('\nTo test manually, run:');
console.log(`curl -X POST https://budolshap.vercel.app/api/shipping/lalamove/webhook \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(testWebhookPayload)}'`);
