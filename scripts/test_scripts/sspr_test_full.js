const BASE_URL = 'http://localhost:8000';
const TEST_EMAIL = 'admin@budolpay.com'; // Use a known email from your DB
const OTP = '852281'; // From server logs

async function testSSPR() {
    console.log('🚀 Starting SSPR End-to-End Test (Full Flow)...');

    try {
        // 1. Verify OTP and get Reset Token
        console.log('Step 2: Verifying OTP...');
        const verifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, otp: OTP })
        });
        
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
            throw new Error(`OTP Verification failed: ${verifyData.error}`);
        }
        const { resetToken } = verifyData;
        console.log('✅ OTP Verified. Reset Token:', resetToken);

        // 2. Reset Password
        console.log('Step 3: Resetting Password...');
        const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resetToken, newPassword: 'NewSecurePassword123!' })
        });
        
        const resetData = await resetRes.json();
        if (!resetRes.ok) {
            throw new Error(`Password Reset failed: ${resetData.error}`);
        }
        console.log('✅ Password Reset Response:', resetData.message);

        // 3. Verify Login with New Password
        console.log('Step 4: Verifying Login with New Password...');
        const loginRes = await fetch(`${BASE_URL}/auth/sso/login-form`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                email: TEST_EMAIL,
                password: 'NewSecurePassword123!',
                apiKey: 'bp_key_2025'
            })
        });
        
        if (loginRes.status === 302) {
            console.log('✅ Login Successful (Redirected)');
        } else {
            const loginData = await loginRes.text();
            throw new Error(`Login failed: ${loginData}`);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

testSSPR();
