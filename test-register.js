const https = require('https');

const timestamp = Date.now();
const testEmail = `test_register_${timestamp}@example.com`;
const testPhone = `09${Math.floor(Math.random() * 900000000 + 100000000)}`;

const payload = JSON.stringify({
    name: 'Test Auto User',
    email: testEmail,
    password: 'TestPassword123!',
    phoneNumber: testPhone,
    deviceFingerprint: 'test-fingerprint-123',
    registrationType: 'standard'
});

console.log('Testing /api/auth/register with payload:', payload);

const options = {
    hostname: 'budolshap.vercel.app',
    port: 443,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Response:', data);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.write(payload);
req.end();
