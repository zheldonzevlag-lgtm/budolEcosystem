const axios = require('axios');
require('dotenv').config();

async function verifyRealtimeGateway() {
    console.log("--- Verifying Realtime Gateway v0.1.1 ---");
    
    const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:8080';
    const apiKey = process.env.BUDOLPAY_API_KEY || 'bs_key_2025';

    console.log(`Checking Gateway connectivity at ${gatewayUrl}...`);

    try {
        // Test 1: Internal notify endpoint exists and responds to unauthorized requests correctly
        try {
            await axios.post(`${gatewayUrl}/internal/notify`, {});
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.log("✅ Test 1 Passed: Unauthorized access blocked.");
            } else {
                console.log(`⚠️ Test 1 Warning: Expected 401, got ${err.response ? err.response.status : err.message}`);
            }
        }

        // Test 2: Trigger a mock audit log event
        const mockPayload = {
            event: 'AUDIT_LOG_CREATED',
            data: { id: 'test-123', action: 'TEST_ACTION', timestamp: new Date().toISOString() },
            isAdmin: true
        };

        try {
            const resp = await axios.post(`${gatewayUrl}/internal/notify`, mockPayload, {
                headers: { 'x-internal-key': apiKey }
            });
            console.log("✅ Test 2 Passed: Event triggered successfully via internal key.");
            console.log("Response:", resp.data);
        } catch (err) {
            console.error("❌ Test 2 Failed: Could not trigger event.", err.response ? err.response.data : err.message);
        }

        console.log("\n--- Verification Complete ---");
    } catch (err) {
        console.error("❌ Critical Error during verification:", err.message);
    }
}

verifyRealtimeGateway();
