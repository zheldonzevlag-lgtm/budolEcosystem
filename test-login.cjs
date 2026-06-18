const https = require('https');

function post(url, body) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const data = JSON.stringify(body);
        const req = https.request({
            hostname: u.hostname,
            path: u.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        }, res => {
            let buf = '';
            res.on('data', c => buf += c);
            res.on('end', () => resolve({ status: res.statusCode, body: buf }));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function test() {
    console.log('=== TEST 1: Mobile Identify (email) ===');
    const r1 = await post('https://budolpay-api-monolith.vercel.app/api/auth/login/mobile/identify', {
        phoneNumber: 'richmondzevlag@gmail.com',
        deviceId: 'test-device-001'
    });
    console.log('Status:', r1.status);
    console.log('Body:', r1.body);
    console.log();

    console.log('=== TEST 2: Mobile Identify (phone 09170000211) ===');
    const r2 = await post('https://budolpay-api-monolith.vercel.app/api/auth/login/mobile/identify', {
        phoneNumber: '09170000211',
        deviceId: 'test-device-002'
    });
    console.log('Status:', r2.status);
    console.log('Body:', r2.body);
    console.log();

    console.log('=== TEST 3: Mobile Identify (phone 639170000211) ===');
    const r3 = await post('https://budolpay-api-monolith.vercel.app/api/auth/login/mobile/identify', {
        phoneNumber: '639170000211',
        deviceId: 'test-device-003'
    });
    console.log('Status:', r3.status);
    console.log('Body:', r3.body);
}

test().catch(e => console.error('Error:', e.message));
