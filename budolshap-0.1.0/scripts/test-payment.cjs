/**
 * Test with correct route path
 */
async function test() {
  const url = 'https://budolpay-api-monolith.vercel.app/api/payment-gw/create-intent';
  
  console.log('Testing:', url);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 10000,
      currency: 'PHP',
      provider: 'internal'
    })
  });
  
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text.substring(0, 300));
}

test();