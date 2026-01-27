async function testLogin() {
    const url = 'http://localhost:3001/api/auth/login';
    const credentials = {
        email: 'tony.stark@budolshap.com',
        password: 'budolshap'
    };

    console.log(`🚀 Testing login for ${credentials.email}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Login successful!');
            console.log('Response:', JSON.stringify(data, null, 2));
            
            // Check for cookie in headers
            const setCookie = response.headers.get('set-cookie');
            if (setCookie) {
                console.log('✅ Cookie received:', setCookie);
            } else {
                console.log('❌ No cookie received in headers.');
            }
        } else {
            console.log('❌ Login failed!');
            console.log('Status:', response.status);
            console.log('Error:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ Error during login test:', error.message);
    }
}

testLogin();
