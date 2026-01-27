const http = require('http');

const data = JSON.stringify({
    email: 'tony.stark@budolshap.com',
    password: 'budolshap',
    apiKey: 'bs_key_2025'
});

const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/auth/sso/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        if (res.statusCode === 302) {
            console.log('✅ SUCCESS: Redirected to', res.headers.location);
        } else {
            console.log('❌ FAILED: Status', res.statusCode);
            console.log('Body:', body);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
