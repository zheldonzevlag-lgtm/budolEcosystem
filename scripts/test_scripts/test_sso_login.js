const axios = require('axios');

async function testSSOLogin() {
    const ssoUrl = 'http://localhost:8000';
    const loginData = {
        email: 'reynaldomgalvez@gmail.com',
        password: 'tr@1t0r2026!',
        apiKey: 'bs_key_2025' // From check-db.js output
    };

    try {
        console.log('Testing SSO Login POST /auth/sso/login...');
        const response = await axios.post(`${ssoUrl}/auth/sso/login`, loginData);
        console.log('Response:', response.status, response.data);
    } catch (error) {
        if (error.response) {
            console.log('Error Response:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testSSOLogin();
