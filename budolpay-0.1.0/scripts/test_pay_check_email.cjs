const axios = require('axios');

async function testPayCheckEmail() {
    const email = 'ivarhanestad@gmail.com';
    // Port 8001 is budolPay auth service
    const url = `http://localhost:8001/check-email?email=${encodeURIComponent(email)}`;

    console.log(`\n📧 [Test Pay Email] Calling: ${url}`);
    try {
        const res = await axios.get(url, { timeout: 5000 });
        console.log(`✅ [Test Pay Email] Response:`, JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(`❌ [Test Pay Email] Error: ${e.message}`);
    }
}

testPayCheckEmail();
