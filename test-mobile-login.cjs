const axios = require('axios');

async function test() {
  console.log('Test: /api/auth/login/mobile/identify');
  const r = await axios.post('https://budolpay-api-monolith.vercel.app/api/auth/login/mobile/identify', {
    phoneNumber: '09171234567',
    deviceId: 'test'
  }, { validateStatus: () => true });
  console.log('Status:', r.status);
  console.log('Data:', JSON.stringify(r.data).substring(0, 500));
}

test();