require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function go() {
  const id = '00000000-0000-0000-0000-000000000005';
  
  await sql`DELETE FROM budolpay."Transaction" WHERE id = ${id}`.catch(() => {});
  await sql`INSERT INTO budolpay."Transaction" (id, amount, type, status, "referenceId", description, "createdAt") VALUES (${id}, '50.00', 'MERCHANT_PAYMENT', 'PENDING', 'DIAG-' || ${Date.now().toString()}, 'Diagnostic', NOW())`;
  console.log('Created budolpay tx:', id);
  
  var r = await sql`SELECT balance FROM budolpay."Wallet" WHERE "userId" = ${'test-user-id'}`;
  console.log('Wallet balance:', r[0]?.balance);

  // Test admin endpoint WITHOUT bypass
  try {
    const resp = await fetch('https://budolpay.vercel.app/api/wallet/process-qr', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer test'},
      body: JSON.stringify({userId: 'test-user-id', qrData: {paymentIntentId: id, amount: 50, storeName: 'Test', orderId: 'diag-001'}})
    });
    console.log('\nTEST 1 (NO bypass):', resp.status, await resp.text());
  } catch(e) { console.log('TEST 1 ERROR:', e.message); }

  // Test admin endpoint WITH bypass
  try {
    const resp = await fetch('https://budolpay.vercel.app/api/wallet/process-qr', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer test', 'x-bypass-auth': 'true'},
      body: JSON.stringify({userId: 'test-user-id', qrData: {paymentIntentId: id, amount: 50, storeName: 'Test', orderId: 'diag-001'}})
    });
    console.log('\nTEST 2 (WITH bypass):', resp.status, await resp.text());
  } catch(e) { console.log('TEST 2 ERROR:', e.message); }

  // Test monolith directly
  try {
    const resp = await fetch('https://budolpay-api-monolith.vercel.app/api/wallet/process-qr', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer test'},
      body: JSON.stringify({userId: 'test-user-id', qrData: {paymentIntentId: id, amount: 50, storeName: 'Test', orderId: 'diag-001'}})
    });
    console.log('\nTEST 3 (monolith direct):', resp.status, await resp.text());
  } catch(e) { console.log('TEST 3 ERROR:', e.message); }
}

go().catch(console.error);
