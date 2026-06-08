/**
 * Test login after schema fix
 */
async function testLogin() {
  console.log('🔐 Testing login after schema fix...\n');
  
  const response = await fetch('https://budolshap.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'tony.stark@budolshap.com',
      password: 'budolshap'
    })
  });
  
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

testLogin();