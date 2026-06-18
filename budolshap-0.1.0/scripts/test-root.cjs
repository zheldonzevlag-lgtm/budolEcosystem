/**
 * Test root endpoint
 */
async function test() {
  const res = await fetch('https://budolpay-api-monolith.vercel.app/');
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text.substring(0, 200));
}

test();