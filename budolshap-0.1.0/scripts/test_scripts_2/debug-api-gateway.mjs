import fetch from 'node-fetch';

async function testApiGateway() {
    console.log('Testing API Gateway at http://localhost:8080/payments/create-intent');
    try {
        const response = await fetch('http://localhost:8080/payments/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 54.00,
                currency: 'PHP',
                provider: 'internal',
                description: 'Test via Gateway',
                metadata: {}
            })
        });

        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        const text = await response.text();
        console.log('Body:', text.substring(0, 500));
    } catch (error) {
        console.error('Error:', error);
    }
}

testApiGateway();
