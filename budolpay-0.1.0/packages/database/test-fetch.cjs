async function testFetch() {
    const res = await fetch('https://budolpay.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ivarhanestad@gmail.com', password: 'B@$t@rd!' })
    });
    console.log(res.status, await res.json());
}
testFetch();
