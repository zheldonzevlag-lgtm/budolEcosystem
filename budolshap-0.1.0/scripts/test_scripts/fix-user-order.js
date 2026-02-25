const crypto = require('crypto');
const http = require('http');
const https = require('https');

// Configuration for the specific order from the screenshot
const CONFIG = {
    webhookUrl: 'https://budulshap.vercel.app/api/shipping/lalamove/webhook',
    secret: 'lalamove_webhook_secret_budolshap_2025',
    orderId: 'cmit7vnqv0002kz049h850tmh',
    lalamoveOrderId: '3379143481582114331'
};

const payload = {
    "eventType": "DRIVER_ASSIGNED",
    "eventTime": new Date().toISOString(),
    "data": {
        "orderId": CONFIG.lalamoveOrderId,
        "status": "ASSIGNING_DRIVER", // Sent as assigning but with driver data usually triggers update
        "driver": {
            "name": "Test Driver 34567",
            "phone": "+639171234567",
            "plateNumber": "VP******4",
            "vehicleType": "Van",
            "photo": "https://example.com/driver.jpg",
            "rating": 4.9,
            "driverId": "88888"
        },
        "location": {
            "lat": "14.5505",
            "lng": "121.0260",
            "updatedAt": new Date().toISOString()
        }
    }
};

async function sendWebhook() {
    console.log(`Sending webhook for Lalamove Order: ${CONFIG.lalamoveOrderId}`);

    // Generate signature
    const body = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', CONFIG.secret).update(body).digest('hex');

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${signature}`,
            'X-Lalamove-Signature': signature
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(CONFIG.webhookUrl, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response: ${data}`);
                resolve(JSON.parse(data));
            });
        });

        req.on('error', (e) => {
            console.error(`Error: ${e.message}`);
            reject(e);
        });

        req.write(body);
        req.end();
    });
}

sendWebhook();
