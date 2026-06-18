/**
 * Test all possible routes
 */
async function test() {
  const base = 'https://budolpay-api-monolith.vercel.app';
  const routes = [
    '/api/payment-gw/create-intent',
    '/create-intent',
    '/payments/create-intent',
    '/api/payments/create-intent',
  ];
  
  for (const route of routes) {
    try {
      const res = await fetch(base + route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 10000,
          currency: 'PHP',
          provider: 'internal'
        })
      });
      console.log(`${res.status} - ${route}`);
      if (res.status !== 404) {
        const text = await res.text();
        console.log('   →', text.substring(0, 150));
      }
    } catch (e) {
      console.log(`ERR - ${route}: ${e.message}`);
    }
  }
}

test();