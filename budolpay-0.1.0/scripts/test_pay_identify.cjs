const axios = require('axios');

async function testPayIdentify() {
    const phone = '09484099400';
    // Port 8001 is budolPay auth service
    const url = `http://localhost:8001/login/mobile/identify`;

    console.log(`\n📞 [Test Identify] Calling: ${url}`);
    try {
        const res = await axios.post(url, {
            phoneNumber: phone,
            deviceId: 'test_device_id'
        }, { timeout: 10000 });
        console.log(`✅ [Test Identify] Response:`, JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(`❌ [Test Identify] Error: ${e.message}`);
        if (e.response) {
            console.error(`Status: ${e.response.status}`);
            console.error(`Data:`, e.response.data);
        }
    }
}

testPayIdentify();
