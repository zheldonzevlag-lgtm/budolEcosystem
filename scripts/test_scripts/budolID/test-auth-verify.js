const axios = require('axios');

async function testVerify() {
    const BUDOLID_URL = 'http://localhost:8000';
    
    console.log('--- Phase 1: Authentication ---');
    try {
        const loginRes = await axios.post(`${BUDOLID_URL}/auth/sso/login`, {
            email: 'reynaldomgalvez@gmail.com',
            password: 'tr@1t0r',
            apiKey: 'bs_key_2025'
        }, {
            maxRedirects: 0,
            validateStatus: (status) => status === 302
        });

        const redirectUrl = loginRes.headers.location;
        console.log('Redirect URL:', redirectUrl);
        
        const token = new URL(redirectUrl).searchParams.get('token');
        console.log('Extracted Token:', token.substring(0, 20) + '...');

        console.log('\n--- Phase 2: Verification (/auth/verify) ---');
        const verifyRes = await axios.get(`${BUDOLID_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Verification Response Status:', verifyRes.status);
        console.log('Verification Data:', JSON.stringify(verifyRes.data, null, 2));

        if (verifyRes.data.valid && verifyRes.data.user.email === 'reynaldomgalvez@gmail.com') {
            console.log('\n✅ SUCCESS: /auth/verify is working correctly!');
        } else {
            console.log('\n❌ FAILURE: Verification data mismatch.');
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.response ? error.response.data : error.message);
    }
}

testVerify();
