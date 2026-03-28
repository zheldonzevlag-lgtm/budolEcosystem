const fetch = require('node-fetch'); // or use native fetch in Node 18+

async function run() {
  try {
    const res = await fetch('https://payment-gateway-service-two.vercel.app/api/payment-gw/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 2123,
        currency: "PHP",
        description: "Test",
        provider: "internal",
        metadata: { orderId: "test_123" }
      })
    });
    
    const text = await res.text();
    console.log(`STATUS: ${res.status}`);
    console.log(`BODY: ${text}`);
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

run();
