require('dotenv').config({ path: '.env' });
const bcrypt = require('bcryptjs');

async function testApiOnly() {
    try {
        const email = 'john.wick@budolshap.com';
        const password = 'budolshap';

        console.log('\n🚀 Testing API Login...');
        const loginUrl = 'https://budolshap-2icgua3hp-jons-projects-9722fe4a.vercel.app/api/auth/login';

        const loginResponse = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        console.log(`Login Status: ${loginResponse.status}`);
        const loginText = await loginResponse.text();
        console.log('Login Response Body (First 500 chars):');
        console.log(loginText.substring(0, 500));

        let authToken = null;
        try {
            const loginData = JSON.parse(loginText);
            if (loginData.token) authToken = loginData.token;
            else if (loginData.user && loginData.user.token) authToken = loginData.user.token;
        } catch (e) {
            console.log('❌ Response is not JSON');
        }

        if (!authToken) {
            const cookies = loginResponse.headers.get('set-cookie');
            if (cookies) {
                const match = cookies.match(/token=([^;]+)/);
                if (match) authToken = match[1];
            }
        }

        if (!authToken) {
            console.log('❌ Failed to get token. Stopping.');
            return;
        }

        console.log('✅ Got Token!');

        console.log('\n🏪 Creating Store...');
        const storeData = {
            userId: "temp_id_will_fail_but_auth_check_first", // We just want to check if AUTH passes
            // Wait, we need a valid user ID for the store logic usually, but let's see if we get past auth 
            // Actually, let's use a dummy ID. If we get 401, auth failed. If 400/500, auth passed!
            name: "Test Store",
            username: `test_${Date.now()}`,
            description: "Test",
            email: "test@test.com",
            contact: "123",
            address: "123",
            logo: ""
        };

        const createResponse = await fetch('https://budolshap-2icgua3hp-jons-projects-9722fe4a.vercel.app/api/stores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(storeData)
        });

        console.log(`Create Store Status: ${createResponse.status}`);
        const createText = await createResponse.text();
        console.log('Create Response:', createText);

    } catch (e) {
        console.error('Error:', e);
    }
}

testApiOnly();
