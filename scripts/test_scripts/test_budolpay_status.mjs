
import axios from 'axios';

async function testPaymentStatusAPI() {
    console.log('🚀 Starting Payment Status API Test...');
    
    // Test parameters
    const baseUrl = 'http://localhost:3000'; // Assuming budolShap is running on 3000
    const testIntentId = 'INTENT-12345'; // BudolPay style intent
    
    try {
        console.log(`🔍 Testing status for ${testIntentId} with provider=budolpay...`);
        const response = await axios.get(`${baseUrl}/api/paymongo/status`, {
            params: {
                intent_id: testIntentId,
                provider: 'budolpay'
            }
        });
        
        console.log('✅ API Response:', response.data);
        
        if (response.data.status) {
            console.log(`✅ Success: Received status "${response.data.status}"`);
        } else {
            console.log('❌ Failure: No status in response');
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('⚠️ Warning: Could not connect to local server. Ensure budolShap is running.');
        } else {
            console.error('❌ Test Error:', error.message);
        }
    }
}

testPaymentStatusAPI();
