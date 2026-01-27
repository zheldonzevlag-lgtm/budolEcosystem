const http = require('http');

const data = JSON.stringify({
    email: 'tony.stark@budolshap.com',
    password: 'budolshap',
    apiKey: 'bp_key_2025'
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
    let responseBody = '';
    console.log(`Status Code: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log('Response:', responseBody);
        if (res.statusCode === 200) {
            console.log('✅ Login successful!');
        } else {
            console.log('❌ Login failed!');
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
