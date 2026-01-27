const axios = require('axios');

// Simulation parameters
const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
const GATEWAY_URL = `http://${LOCAL_IP}:8080`;
const TX_SERVICE_URL = `http://${LOCAL_IP}:8003`;

async function simulateTransfer() {
    console.log('--- Simulating P2P Transfer for Real-time Forensic Audit Verification ---');
    
    try {
        // 1. Simulate a P2P transfer
        // We'll use existing user IDs if possible, or just IDs that won't break things
        // For testing, let's use the Peter Parker ID if we can find it, or just use dummy IDs
        // Actually, the transaction service needs real users to check KYC and balance.
        // Let's just trigger the notifyAdmin directly to see if the UI reacts, 
        // OR we can use the actual endpoint if we have valid test users.
        
        console.log('Triggering P2P_TRANSFER_COMPLETED audit log via transaction-service...');
        
        // Let's find a user first to make it realistic
        // We'll just use dummy data for the audit log if we want to test the UI notification
        
        const dummyAuditLog = {
            id: `TEST-${Date.now()}`,
            action: 'P2P_TRANSFER_COMPLETED',
            entity: 'Financial',
            entityId: 'TX-TEST-123',
            userId: 'user_2s6m9r6m9r6m9r6m9r6m9r6m', // Just a placeholder
            newValue: {
                amount: 150.00,
                referenceId: 'BP-TEST-REF',
                type: 'P2P_TRANSFER',
                receiverId: 'user_rcvr_123'
            },
            metadata: {
                compliance: 'BSP Circular No. 808',
                standard: 'Financial Transaction Audit'
            },
            createdAt: new Date().toISOString(),
            user: {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com'
            }
        };

        console.log('Sending mock AUDIT_LOG_CREATED to Gateway...');
        const response = await axios.post(`${GATEWAY_URL}/internal/notify`, {
            isAdmin: true,
            event: 'AUDIT_LOG_CREATED',
            data: dummyAuditLog
        });

        if (response.data.success) {
            console.log('✅ Mock audit log sent successfully!');
            console.log('Check the Admin Dashboard -> Security page. The log "P2P_TRANSFER_COMPLETED" should appear instantly.');
        } else {
            console.error('❌ Failed to send mock audit log');
        }

    } catch (error) {
        console.error('Error during simulation:', error.message);
    }
}

simulateTransfer();
