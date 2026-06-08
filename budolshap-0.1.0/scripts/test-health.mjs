/**
 * Test simple health check
 */

async function test() {
  try {
    const response = await fetch('https://budolshap.vercel.app/api/test-env', {
      method: 'GET'
    });
    console.log('Status:', response.status);
    const data = await response.text();
    console.log('Response:', data.substring(0, 500));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();