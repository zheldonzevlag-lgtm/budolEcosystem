const axios = require('axios');

async function testPayCheckPhone() {
    const phone = '09484099400';
    // Port 8001 is budolPay auth service
    const url = `http://localhost:8001/check-phone?phone=${encodeURIComponent(phone)}`;

    console.log(`\n📞 [Test Pay] Calling: ${url}`);
    try {
        const res = await axios.get(url, { timeout: 5000 });
        console.log(`✅ [Test Pay] Response:`, JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(`❌ [Test Pay] Error: ${e.message}`);
        if (e.response) {
            console.error(`Status: ${e.response.status}`);
            console.error(`Data:`, e.response.data);
        }
    }
}

testPayCheckPhone();
