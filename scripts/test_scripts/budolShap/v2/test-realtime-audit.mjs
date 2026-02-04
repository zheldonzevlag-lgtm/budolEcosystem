
import { triggerRealtimeEvent } from '../../../../budolshap-0.1.0/lib/realtime.js';
import { prisma } from '../../../../budolshap-0.1.0/lib/prisma.js';

async function testRealtimeAudit() {
    console.log('--- Phase 5: Realtime Audit Trigger Verification ---');
    
    try {
        // 1. Mock a new audit log
        const mockLog = {
            id: 'test-realtime-' + Date.now(),
            userId: 'system',
            action: 'LOGIN',
            ipAddress: '127.0.0.1',
            device: 'Test Runner',
            city: 'Manila',
            country: 'Philippines',
            user: {
                name: 'Test Admin',
                email: 'admin@budolecosystem.com'
            },
            timestamp: new Date().toISOString()
        };

        console.log('Triggering AUDIT_LOG_CREATED event for:', mockLog.action);

        // 2. Trigger the event
        const result = await triggerRealtimeEvent('admin', 'AUDIT_LOG_CREATED', mockLog);

        console.log('Trigger Result:', result);

        if (result.success) {
            console.log('SUCCESS: Realtime event triggered successfully via', result.mode);
        } else {
            console.error('FAILED: Realtime event trigger failed:', result.error);
        }

    } catch (error) {
        console.error('ERROR during test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testRealtimeAudit();
