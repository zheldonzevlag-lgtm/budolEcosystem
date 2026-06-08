const https = require('https');

const testEmail = 'test_check_user_' + Date.now() + '@example.com';
console.log('Testing /api/auth/check-email with', testEmail);

const req = https.get(`https://budolshap.vercel.app/api/auth/check-email?email=${encodeURIComponent(testEmail)}`, (res) => {
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
