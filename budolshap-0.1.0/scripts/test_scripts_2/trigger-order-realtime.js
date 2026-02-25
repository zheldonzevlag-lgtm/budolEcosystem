const fetch = require('node-fetch');

async function triggerOrder() {
    const baseUrl = 'http://localhost:3000';

    // 1. Login to get Token
    console.log('Logging in as Barry...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'barry.allen@budolshap.com',
            password: 'budolshap'
        })
    });

    const loginData = await loginRes.json();
    if (!loginData.token) {
        console.error('Login failed:', loginData);
        return;
    }
    const token = loginData.token;
    console.log(`Logged in with token.`);

    // 2. Create Order
    console.log('Creating Order...');
    const orderRes = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            userId: 'user_1765684794325_5y0o00o',
            addressId: 'cmj58xwf70001f42snaq9kf0r',
            paymentMethod: 'COD',
            orderItems: [
                {
                    productId: 'cmj43fb420009jy04l44yaew5',
                    quantity: 1
                }
            ],
            shipping: { provider: 'lalamove', service: 'MOTORCYCLE' },
            shippingCost: 50
        })
    });

    const text = await orderRes.text();
    try {
        const orderData = JSON.parse(text);
        if (orderRes.ok) {
            console.log('✅ Order Created Successfully!', orderData);
        } else {
            console.error('❌ Order Creation Failed:', orderData);
        }
    } catch (e) {
        console.error('Failed to parse response:', text);
    }
}

console.log('Waiting 20 seconds before triggering order...');
setTimeout(() => {
    triggerOrder();
}, 20000);
