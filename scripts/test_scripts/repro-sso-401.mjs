
import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load envs
const budolIDEnv = dotenv.parse(fs.readFileSync(path.join(__dirname, '../../budolID-0.1.0/.env')));
const budolShapEnv = dotenv.parse(fs.readFileSync(path.join(__dirname, '../../budolshap-0.1.0/.env')));

const BUDOLID_URL = 'http://localhost:8000';
const BUDOLSHAP_URL = 'http://localhost:3001';

// Test credentials
const email = 'reynaldomgalvez@gmail.com';
const password = 'tr@1t0r';

async function testSSOFlow() {
    console.log('--- Starting SSO Flow Repro ---');
    
    try {
        // 1. Login to budolID
        console.log('1. Logging in to budolID...');
        const loginRes = await axios.post(`${BUDOLID_URL}/auth/sso/login`, {
            email,
            password,
            apiKey: 'bs_key_2025'
        }).catch(err => {
            console.error('Login Request failed:', err.response?.data || err.message);
            throw err;
        });
        
        if (!loginRes.data || !loginRes.data.token) {
            throw new Error('No token returned from budolID');
        }

        const { redirectUri, token } = loginRes.data;
        console.log('✅ Login successful. Token received.');
        console.log('Redirect URI:', redirectUri);
        
        // 2. Follow redirect to budolShap callback
        console.log('\n2. Following redirect to budolShap callback...');
        const callbackUrl = `${redirectUri}?token=${token}`;
        const callbackRes = await axios.get(callbackUrl, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400
        });
        
        const cookies = callbackRes.headers['set-cookie'];
        console.log('✅ Callback successful. Cookies received:', cookies ? cookies.length : 0);
        
        if (!cookies) {
            console.error('❌ No cookies received from callback!');
            return;
        }
        
        // Extract budolshap_token
        const tokenCookie = cookies.find(c => c.startsWith('budolshap_token=') || c.startsWith('token='));
        if (!tokenCookie) {
            console.error('❌ No auth cookie found in set-cookie header!');
            return;
        }
        
        const localToken = tokenCookie.split(';')[0].split('=')[1];
        console.log('Local Token (first 10):', localToken.substring(0, 10));
        
        // 3. Verify local token with budolShap secret
        console.log('\n3. Verifying local token with budolShap secret...');
        const shapSecret = budolShapEnv.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';
        try {
            const decoded = jwt.verify(localToken, shapSecret);
            console.log('✅ Token verified locally with secret:', shapSecret.substring(0, 5) + '...');
            console.log('Decoded:', JSON.stringify(decoded, null, 2));
        } catch (e) {
            console.error('❌ Token verification failed locally:', e.message);
            console.log('Used secret:', shapSecret);
        }
        
        // 4. Hit /api/auth/me
        console.log('\n4. Hitting /api/auth/me...');
        try {
            const meRes = await axios.get(`${BUDOLSHAP_URL}/api/auth/me`, {
                headers: {
                    Cookie: cookies.join('; ')
                }
            });
            console.log('✅ /api/auth/me successful!');
            console.log('User:', JSON.stringify(meRes.data.user, null, 2));
        } catch (e) {
            console.error('❌ /api/auth/me failed:', e.response?.status, e.response?.data);
        }
        
    } catch (e) {
        console.error('Error during test:', e.response?.data || e.message);
    }
}

testSSOFlow();
