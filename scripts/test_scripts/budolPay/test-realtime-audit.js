
const axios = require('axios');
const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
const GATEWAY_URL = `http://${LOCAL_IP}:8080`;

async function testRealtimeAudit() {
    console.log('--- Testing Real-time Audit Log Notification ---');
    
    const mockLog = {
        id: 'test-log-' + Date.now(),
        userId: 'clv123456',
        action: 'SECURITY_TEST_REALTIME',
        entity: 'Security',
        entityId: 'clv123456',
        ipAddress: '127.0.0.1',
        userAgent: 'TestScript',
        device: 'TEST_DEVICE',
        createdAt: new Date().toISOString(),
        user: {
            id: 'clv123456',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com'
        },
        metadata: {
            compliance: {
                pci_dss: '10.2.2',
                bsp: 'Circular 808'
            }
        }
    };

    try {
        console.log(`Sending notification to ${GATEWAY_URL}/internal/notify...`);
        const response = await axios.post(`${GATEWAY_URL}/internal/notify`, {
            isAdmin: true,
            event: 'AUDIT_LOG_CREATED',
            data: mockLog
        });
        
        console.log('Gateway Response:', response.data);
        if (response.data.success) {
            console.log('✅ Real-time notification sent successfully!');
        } else {
            console.log('❌ Gateway returned failure.');
        }
    } catch (err) {
        console.error('❌ Failed to send notification:', err.message);
        if (err.response) {
            console.error('Error details:', err.response.data);
        }
    }
}

testRealtimeAudit();
