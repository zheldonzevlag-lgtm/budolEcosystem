const BASE_URL = 'http://localhost:8000';
const TEST_EMAIL = 'admin@budolpay.com'; // Use a known email from your DB

async function testSSPR() {
    console.log('🚀 Starting SSPR End-to-End Test...');

    try {
        // 1. Forgot Password (Request OTP)
        console.log('Step 1: Requesting OTP...');
        const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL })
        });
        const forgotData = await forgotRes.json();
        console.log('✅ Forgot Password Response:', forgotData.message);

        // Note: In a real test, you'd fetch the OTP from the DB or a mock mailer.
        // For this automated test, we will check the DB for the OTP.
        
        console.log('⚠️ Manual Step: Check server logs for OTP or query DB directly.');
        
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

testSSPR();
