const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
const VERIFICATION_URL = process.env.VERIFICATION_SERVICE_URL || 'http://localhost:8006';

async function testFullAccountFlow() {
  console.log('--- STARTING KYC AND ACCOUNT CREATION TEST ---');
  
  const testPhone = `09${Math.floor(100000000 + Math.random() * 900000000)}`;
  const deviceId = `test-device-${Math.random().toString(36).substring(7)}`;
  
  try {
    // 1. Quick Registration
    console.log(`[Step 1] Initiating Quick Registration for ${testPhone}...`);
    const regRes = await axios.post(`${AUTH_URL}/register/quick`, {
      phoneNumber: testPhone,
      firstName: 'TestUser',
      deviceId: deviceId
    });
    
    const userId = regRes.data.userId;
    console.log(`[Success] User created with ID: ${userId}`);
    
    // 2. Verify OTP (using local bypass code 123456)
    console.log(`[Step 2] Verifying OTP for User ${userId}...`);
    const otpRes = await axios.post(`${AUTH_URL}/verify-otp`, {
      userId: userId,
      otp: '123456',
      type: 'SMS',
      deviceId: deviceId
    });
    
    console.log(`[Success] OTP Verified. Status: ${otpRes.data.status}`);
    const token = otpRes.data.token;
    
    // 3. Setup PIN
    console.log(`[Step 3] Setting up 6-digit PIN...`);
    const pinRes = await axios.post(`${AUTH_URL}/login/mobile/setup-pin`, {
      userId: userId,
      pin: '112233'
    });
    
    console.log(`[Success] ${pinRes.data.message}`);
    const fullToken = pinRes.data.token;
    
    // 4. KYC Verification (Selfie + Face Template)
    console.log(`[Step 4] Submitting KYC Verification...`);
    const kycRes = await axios.post(`${VERIFICATION_URL}/verify`, {
      userId: userId,
      type: 'SELFIE',
      faceTemplate: 'BASE64_ENCODED_FACE_TEMPLATE_DATA'
    });
    
    console.log(`[Success] KYC Status: ${kycRes.data.status}, Tier: ${kycRes.data.tier}`);
    
    // 5. Verify Final Status
    console.log(`[Step 5] Checking Final User Status...`);
    const statusRes = await axios.get(`${VERIFICATION_URL}/status/${userId}`);
    
    console.log('[FINAL STATUS]', statusRes.data);
    
    if (statusRes.data.kycStatus === 'VERIFIED' && statusRes.data.kycTier === 'FULLY_VERIFIED') {
      console.log('--- TEST PASSED: ACCOUNT CREATION AND KYC FULLY WORKING ---');
    } else {
      console.error('--- TEST FAILED: KYC STATUS OR TIER MISMATCH ---');
    }
    
  } catch (error) {
    console.error('--- TEST ERROR ---');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testFullAccountFlow();
