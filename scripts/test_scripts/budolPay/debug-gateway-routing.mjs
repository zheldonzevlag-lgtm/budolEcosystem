import fetch from 'node-fetch';

async function testGatewayRouting() {
    const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
    const baseUrl = `http://${LOCAL_IP}:8080`;
    console.log(`\n--- Testing Gateway Routing to Payments on ${baseUrl} ---`);
    
    try {
        console.log('1. Testing /health...');
        const healthRes = await fetch(`${baseUrl}/health`);
        console.log(`Status: ${healthRes.status}`);
        console.log('Data:', await healthRes.json());

        console.log('\n2. Testing /payments/health...');
        const payHealthRes = await fetch(`${baseUrl}/payments/health`);
        console.log(`Status: ${payHealthRes.status}`);
        const payHealthData = await payHealthRes.json();
        console.log('Data:', JSON.stringify(payHealthData, null, 2));

        console.log('\n3. Testing /payments/create-intent (POST)...');
        const createRes = await fetch(`${baseUrl}/payments/create-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 100,
                currency: 'PHP',
                description: 'Test Intent'
            })
        });
        console.log(`Status: ${createRes.status}`);
        const createData = await createRes.json();
        console.log('Data:', JSON.stringify(createData, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testGatewayRouting();
