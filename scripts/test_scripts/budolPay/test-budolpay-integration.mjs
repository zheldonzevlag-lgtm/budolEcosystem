import fetch from 'node-fetch';

async function testBudolPayIntegration() {
    const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
    const baseUrl = `http://${LOCAL_IP}:3001`;
    console.log('🚀 Testing BudolPay Integration from budolShap...');

    const testData = {
        amount: 15000, // 150.00 PHP
        currency: 'PHP',
        method: 'BUDOL_PAY',
        provider: 'budolpay',
        description: 'Integration Test Order',
        orderId: 'test-' + Date.now(),
        billing: {
            name: 'John Doe',
            email: 'john@example.com'
        }
    };

    try {
        const response = await fetch(`${baseUrl}/api/payment/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });

        const result = await response.json();
        console.log('\n--- Response Result ---');
        console.log(JSON.stringify(result, null, 2));

        if (result.checkoutUrl || result.paymentIntentId) {
            console.log('\n✅ Integration Successful!');
        } else {
            console.log('\n⚠️ Integration returned unexpected format.');
        }

    } catch (error) {
        console.error('\n❌ Integration Failed:');
        console.error(error.message);
    }
}

testBudolPayIntegration();
