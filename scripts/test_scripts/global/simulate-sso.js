const axios = require('axios');
const jwt = require('jsonwebtoken');

// Use the same secret as the apps
const JWT_SECRET = "GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=";
const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
const SHAP_URL = `http://${LOCAL_IP}:3001`;
const SSO_URL = `http://${LOCAL_IP}:8000`;

async function simulateSSOCallback() {
    console.log('--- Simulating SSO Callback ---');
    
    // 1. Generate a token that budolID would generate
    // Note: In a real scenario, this token must exist in budolID's session table
    // because the callback verifies it with budolID.
    
    // So first, let's get a real token by logging into budolID
    try {
        console.log('Logging into budolID...');
        const loginResponse = await axios.post(`${SSO_URL}/auth/sso/login`, {
            email: 'galvezjon59@gmail.com',
            password: 'password123',
            apiKey: 'bs_key_2025' // budolShap's API key
        }, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400
        });
        
        // The response should be a redirect with a token
        const redirectUrl = loginResponse.headers.location;
        console.log('Redirect URL:', redirectUrl);
        
        if (!redirectUrl) {
            console.error('No redirect URL found in login response');
            return;
        }
        
        const url = new URL(redirectUrl);
        const token = url.searchParams.get('token');
        console.log('Token found:', token ? token.substring(0, 10) + '...' : 'NONE');
        
        if (!token) {
            console.error('No token found in redirect URL');
            return;
        }

        // 2. Call the budolShap callback with this token
        console.log('\nCalling budolShap callback...');
        const callbackResponse = await axios.get(`${SHAP_URL}/auth/callback?token=${token}`, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400
        });
        
        console.log('Callback response status:', callbackResponse.status);
        console.log('Callback headers:', JSON.stringify(callbackResponse.headers, null, 2));
        
        const setCookie = callbackResponse.headers['set-cookie'];
        console.log('Set-Cookie:', setCookie);
        
        if (setCookie) {
            console.log('✅ Cookie was set!');
            
            // 3. Call /api/auth/me with this cookie
            console.log('\nCalling budolShap /api/auth/me with cookie...');
            const meResponse = await axios.get(`${SHAP_URL}/api/auth/me`, {
                headers: {
                    'Cookie': setCookie[0]
                }
            });
            
            console.log('Me response status:', meResponse.status);
            console.log('Me response data:', JSON.stringify(meResponse.data, null, 2));
        } else {
            console.log('❌ Cookie was NOT set!');
        }

        // --- Test budolPay Admin ---
        console.log('\n--- Simulating budolPay Admin SSO Callback ---');
        
        const payLoginResponse = await axios.post(`${SSO_URL}/auth/sso/login`, {
            email: 'galvezjon59@gmail.com',
            password: 'password123',
            apiKey: 'bp_key_2025' // budolPay's API key
        }, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400
        });

        // In this environment, the response might be in headers.location or data.redirectUrl
        const payRedirectUrl = payLoginResponse.headers.location || (payLoginResponse.data && payLoginResponse.data.redirectUrl);
        console.log('Redirect URL:', payRedirectUrl);
        
        if (payRedirectUrl) {
            const payToken = new URL(payRedirectUrl).searchParams.get('token');
            
            console.log('\nCalling budolPay Admin callback...');
            const payCallbackResponse = await axios.get(`http://${LOCAL_IP}:3000/api/auth/callback?token=${payToken}`, {
                maxRedirects: 0,
                validateStatus: (status) => status >= 200 && status < 400
            });

            console.log('Callback response status:', payCallbackResponse.status);
            const payCookies = payCallbackResponse.headers['set-cookie'];
            console.log('Callback cookies:', JSON.stringify(payCookies, null, 2));

            if (payCookies && payCookies.some(c => c.includes('budolpay_token'))) {
                console.log('✅ Cookie budolpay_token was set!');
                
                const payAuthCookie = payCookies.find(c => c.startsWith('budolpay_token=')).split(';')[0];

                console.log('\nCalling budolPay Admin /api/auth/me with cookie...');
        const payMeResponse = await axios.get(`http://${LOCAL_IP}:3000/api/auth/me`, {
            headers: {
                'Cookie': payAuthCookie
            }
        });
        console.log('Me response status:', payMeResponse.status);
        console.log('Me response data:', JSON.stringify(payMeResponse.data, null, 2));

        // --- Test budolID /auth/verify ---
        console.log('\n--- Testing budolID /auth/verify with budolpay_token ---');
        const payTokenValue = payAuthCookie.split('=')[1];
        try {
            const verifyResponse = await axios.get(`${SSO_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${payTokenValue}`
                }
            });
            console.log('Verify response status:', verifyResponse.status);
            console.log('Verify response data:', JSON.stringify(verifyResponse.data, null, 2));
        } catch (err) {
            console.error('Verify failed:', err.response ? err.response.data : err.message);
        }
            } else {
                console.log('❌ Cookie budolpay_token was NOT set!');
            }
        } else {
            console.error('No redirect URL found in pay login response');
        }

    } catch (error) {
        console.error('Error during simulation:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

simulateSSOCallback();
