/**
 * Test different routes
 */
async function test() {
  const base = 'https://budolpay-api-monolith.vercel.app';
  const routes = [
    '/',
    '/create-intent',
    '/api/payment-gw/create-intent',
    '/api/payment-gw/',
  ];
  
  for (const route of routes) {
    try {
      const res = await fetch(base + route, { method: 'POST' });
      console.log(`${res.status} - ${route}`);
      if (res.status !== 404) {
        const text = await res.text();
        console.log('   →', text.substring(0, 100));
      }
    } catch (e) {
      console.log(`ERR - ${route}: ${e.message}`);
    }
  }
}

test();