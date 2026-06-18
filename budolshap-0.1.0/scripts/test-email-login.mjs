/**
 * Test login with real database users
 */

async function testLogin() {
  console.log('🔐 Testing login with real users...\n');
  
  // Real users from database
  const testUsers = [
    { email: 'jon.galvez@budolshap.com', password: 'password123' },
    { email: 'tony.stark@budolshap.com', password: 'password123' },
  ];
  
  for (const user of testUsers) {
    console.log(`\n📧 Testing: ${user.email}`);
    try {
      const response = await fetch('https://budolshap.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      console.log('   Status:', response.status);
      const data = await response.json();
      console.log('   Response:', JSON.stringify(data).substring(0, 500));
      
      if (response.status === 200 && data.status === 'OTP_REQUIRED') {
        console.log('   ✅ SUCCESS - OTP sent!');
        break;
      }
    } catch (error) {
      console.error('   ❌ Error:', error.message);
    }
  }
}

testLogin();