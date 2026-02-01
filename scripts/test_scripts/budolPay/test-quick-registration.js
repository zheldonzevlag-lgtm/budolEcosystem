const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testQuickRegistration() {
    const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
    
    console.log('--- Phase 5: Testing Quick Registration (Phone Only) ---');
    
    const phoneNumber = `09${Math.floor(100000000 + Math.random() * 900000000)}`;
    const testPayload = {
        phoneNumber: phoneNumber,
        firstName: 'QuickTest',
        deviceId: 'test-device-id-123'
    };

    console.log(`[Step 1] Initializing Quick Registration for ${phoneNumber}...`);
    
    try {
        const response = await fetch(`${AUTH_SERVICE_URL}/register/quick`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });

        const data = await response.json();
        
        if (response.status === 201) {
            console.log('✅ Quick Registration Initialized Successfully!');
            console.log('Response:', JSON.stringify(data, null, 2));
            
            const userId = data.userId;
            
            // Step 2: Verify OTP (Simulating local env where OTP is 123456)
            console.log(`[Step 2] Verifying OTP for User ID: ${userId}...`);
            const otpResponse = await fetch(`${AUTH_SERVICE_URL}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    otp: '123456',
                    type: 'REGISTRATION',
                    deviceId: 'test-device-id-123'
                })
            });

            const otpData = await otpResponse.json();
            if (otpResponse.status === 200) {
                console.log('✅ OTP Verified Successfully!');
                console.log('Status:', otpData.status);
                
                if (otpData.status === 'PIN_SETUP_REQUIRED') {
                    console.log('✅ Correct flow: PIN setup is required for new quick-reg users.');
                }
            } else {
                console.error('❌ OTP Verification Failed:', otpData);
            }

        } else {
            console.error('❌ Quick Registration Failed:', data);
        }
    } catch (error) {
        console.error('❌ Error during testing:', error.message);
    }
}

testQuickRegistration();
