const axios = require('axios');
const qs = require('querystring');

async function testLogin() {
  try {
    const res = await axios.post('http://192.168.1.2:8000/auth/sso/login-form', qs.stringify({
      email: 'admin@budol.com',
      password: 'password123',
      apiKey: 'bp_b31ea1888dcb2ba76fdbb776ea8f5b7a'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      maxRedirects: 0,
      validateStatus: (status) => status < 500
    });
    console.log('Status:', res.status);
    console.log('Headers:', res.headers.location);
    if (res.status === 302) {
        console.log('✅ Success! Redirected to:', res.headers.location);
    } else {
        console.log('❌ Failed. Body:', res.data);
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}
testLogin();