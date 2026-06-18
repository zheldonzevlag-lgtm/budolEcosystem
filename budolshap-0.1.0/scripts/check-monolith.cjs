/**
 * Check monolith routes
 */
async function check() {
  const url = 'https://budolpay-api-monolith.vercel.app';
  
  console.log('Checking:', url);
  console.log('');
  
  // Check root
  const res1 = await fetch(url);
  console.log('GET / :', res1.status);
  
  // Check create-intent
  const res2 = await fetch(url + '/create-intent', { method: 'POST' });
  console.log('POST /create-intent :', res2.status);
  
  // Check api/payment-gw
  const res3 = await fetch(url + '/api/payment-gw/create-intent', { method: 'POST' });
  console.log('POST /api/payment-gw/create-intent :', res3.status);
}

check();