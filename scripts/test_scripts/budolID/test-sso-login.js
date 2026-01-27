const axios = require('axios');

async function testLogin() {
  const loginData = {
    email: 'test@example.com',
    password: 'password123',
    apiKey: 'bp_key_2025' // budolPay API Key
  };

  console.log('Testing SSO Login with:', loginData);

  try {
    const response = await axios.post('http://localhost:8000/auth/sso/login', loginData);
    console.log('Login Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Login Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();
