import fetch from 'node-fetch';

async function testGateway() {
    const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8004';
    try {
        const response = await fetch(`${GATEWAY_URL}/create-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 54.00,
                currency: 'PHP',
                provider: 'internal',
                description: 'Test',
                metadata: {}
            })
        });

        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Body:', text.substring(0, 500));
    } catch (error) {
        console.error('Error:', error);
    }
}

testGateway();
