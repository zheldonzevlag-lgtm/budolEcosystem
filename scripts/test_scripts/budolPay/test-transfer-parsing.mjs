import fetch from 'node-fetch';

async function testParsing() {
    const url = 'http://localhost:8003/transfer';
    const payload = {
        senderId: 'test-sender',
        receiverId: 'test-receiver',
        amount: 100,
        description: 'Test transfer'
    };

    console.log('🚀 Sending test request to transaction-service...');
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('📥 Response status:', response.status);
        console.log('📥 Response data:', JSON.stringify(data, null, 2));

        if (response.status === 400 && data.message && data.message.includes('body is empty')) {
            console.error('❌ FAIL: Request body was not parsed by transaction-service.');
        } else if (response.status === 500 && data.error && data.error.includes('Sender not found')) {
             console.log('✅ SUCCESS: Request body was parsed! (Stopped at DB check as expected)');
        } else {
            console.log('ℹ️ Result:', data.error || data.message || 'Unknown');
        }
    } catch (error) {
        console.error('❌ Error connecting to service:', error.message);
        console.log('Make sure transaction-service is running on port 8003.');
    }
}

testParsing();
