const axios = require('axios');

async function test() {
  const r = await axios.get('https://budolpay-api-monolith.vercel.app/api/test', { validateStatus: () => true });
  console.log(r.status, r.data);
}
test();