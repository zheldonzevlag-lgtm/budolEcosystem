const http = require('http');

async function main() {
    const bookingId = '3390733014496927927';

    console.log('📦 Simulating DRIVER_ASSIGNED webhook locally');
    console.log('Booking ID:', bookingId);

    const payload = {
        eventType: 'DRIVER_ASSIGNED',
        data: {
            order: {
                orderId: bookingId,
                status: 'ON_GOING'
            },
            driver: {
                name: "Test Driver 34567",
                phone: "+631001234567",
                plateNumber: "VP9946964",
                vehicleType: "VAN",
                photoUrl: "https://web.lalamove.com/assets/images/courier-placeholder.png"
            }
        }
    };

    const body = JSON.stringify(payload);

    // We hit the local endpoint. The local endpoint doesn't strictly verify signature in dev mode 
    // (or we can skip it if the code allows)
    // Actually, looking at the code, it logs the signature but doesn't throw if it fails (V2-ROBUST)

    const options = {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/webhooks/lalamove',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log(`✅ Response: ${res.statusCode}`);
            console.log('Body:', data);
        });
    });

    req.on('error', (e) => {
        console.error('❌ Error:', e.message);
    });

    req.write(body);
    req.end();
}

main();
