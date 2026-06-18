/**
 * Discover payment gateway routes
 */
async function discover() {
  const baseUrls = [
    'https://payment-gateway-service-two.vercel.app',
    'https://payment-gateway-service-two.vercel.app/api',
    'https://payment-gateway-service-two.vercel.app/api/payment-gw',
    'https://payment-gateway-service.vercel.app',
  ];
  
  for (const url of baseUrls) {
    try {
      const res = await fetch(url, { method: 'GET' });
      console.log(`${res.status} - ${url}`);
      if (res.ok) {
        const data = await res.json();
        console.log('   ->', JSON.stringify(data));
      }
    } catch (e) {
      console.log(`ERR - ${url}: ${e.message}`);
    }
  }
}

discover();