const axios = require('axios');

async function testAdminLogin() {
  const loginData = {
    email: 'reynaldomgalvez@gmail.com',
    password: 'tr@1t0r',
    apiKey: 'bp_key_2025'
  };

  console.log('--- Testing Admin Login for reynaldomgalvez@gmail.com ---');
  
  try {
    const response = await axios.post('http://localhost:8000/auth/sso/login', loginData);
    console.log('✅ Login Successful!');
    console.log('User Role:', response.data.user.role);
    console.log('Token Received:', response.data.token ? 'Yes' : 'No');
    
    if (response.data.user.role !== 'ADMIN') {
      console.error('❌ Error: User role is not ADMIN!');
    }
  } catch (error) {
    console.error('❌ Login Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
  console.log('--- Test Complete ---');
}

testAdminLogin();
