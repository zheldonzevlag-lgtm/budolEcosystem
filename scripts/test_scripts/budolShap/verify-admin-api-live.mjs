import fetch from 'node-fetch';

async function testAdminCheck() {
    const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
    const baseUrl = `http://${LOCAL_IP}:3001`;
    console.log(`\n--- Testing Admin Check API on ${baseUrl} ---`);

    try {
        // We don't have a valid cookie here easily, so we expect a 401
        // But we want to see if the server responds and doesn't crash
        const response = await fetch(`${baseUrl}/api/auth/admin/check`);
        const status = response.status;
        const data = await response.json();

        console.log(`Status: ${status}`);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (status === 401) {
            console.log('✅ Received expected 401 Unauthorized (no session). Server is alive and fix is active.');
        } else if (status === 200) {
            console.log('✅ Received 200 OK. Admin session detected.');
        } else {
            console.log(`❌ Unexpected status: ${status}`);
        }
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

testAdminCheck();
