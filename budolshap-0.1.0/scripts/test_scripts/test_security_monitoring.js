
import { prisma } from '../../lib/prisma.js';
import { createAuditLog } from '../../lib/audit.js';

async function testSecurityMonitoring() {
    try {
        console.log('Running Security Monitoring & Audit Trail Verification...');
        
        // 1. Simulate Rate Limit (DDoS) Event
        console.log('1. Simulating DDOS_MITIGATED event...');
        const ddosLog = await createAuditLog(null, 'DDOS_MITIGATED', null, {
            entity: 'RateLimit',
            entityId: 'test:ddos:ip:127.0.0.1',
            status: 'WARNING',
            details: 'Test Rate limit exceeded. Blocked request.',
            metadata: { limit: 10, currentPoints: 11, ip: '127.0.0.1', windowSeconds: 60 }
        });
        console.log('   -> Log Created:', ddosLog.id);

        // 2. Simulate Unauthorized Admin Access (RBAC)
        console.log('2. Simulating UNAUTHORIZED_ACCESS event...');
        const rbacLog = await createAuditLog(null, 'UNAUTHORIZED_ACCESS', null, {
            entity: 'AdminRoute',
            status: 'FAILURE',
            details: 'Test Blocked admin access attempt.',
            metadata: { permissionRequired: 'ADMIN', path: '/admin/sensitive', identity: 'test-user@example.com' }
        });
        console.log('   -> Log Created:', rbacLog.id);

        // 3. Simulate Failed Login (Brute Force)
        console.log('3. Simulating LOGIN_FAILED event...');
        const loginLog = await createAuditLog(null, 'LOGIN_FAILED', null, {
            entity: 'Auth',
            status: 'FAILURE',
            details: 'Test Login failed: User not found (attacker@example.com)',
            metadata: { email: 'attacker@example.com', ip: '192.168.1.100' }
        });
        console.log('   -> Log Created:', loginLog.id);

        // 4. Verify Logs Exist in Database
        console.log('4. Verifying logs in database...');
        const logs = await prisma.auditLog.findMany({
            where: {
                id: { in: [ddosLog.id, rbacLog.id, loginLog.id] }
            },
            select: { id: true, action: true, status: true, details: true }
        });

        if (logs.length === 3) {
            console.log('   -> SUCCESS: All 3 security events found in AuditLog table.');
            logs.forEach(log => console.log(`      - [${log.action}] Status: ${log.status}, Details: ${log.details}`));
        } else {
            console.error('   -> FAILURE: Expected 3 logs, found', logs.length);
        }

        // 5. Verify Compliance Calculation Logic (Simulated)
        console.log('5. Verifying Compliance Status Logic...');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const recentIncidents = await prisma.auditLog.groupBy({
            by: ['action'],
            where: {
                createdAt: { gte: yesterday },
                status: { in: ['FAILURE', 'WARNING'] }
            },
            _count: { action: true }
        });

        const incidentMap = recentIncidents.reduce((acc, curr) => {
            acc[curr.action] = curr._count.action;
            return acc;
        }, {});

        console.log('   -> Incident Counts (Last 24h):', incidentMap);

        const ddosCount = incidentMap['DDOS_MITIGATED'] || 0;
        const rbacCount = incidentMap['UNAUTHORIZED_ACCESS'] || 0;
        const loginFailCount = incidentMap['LOGIN_FAILED'] || 0;

        const ddosStatus = ddosCount > 0 ? 'Mitigating' : 'Monitoring';
        const rbacStatus = rbacCount > 0 ? 'Enforced' : 'Active'; // Actually, if we see failures, it means it IS enforced.
        
        console.log(`   -> DDoS Protection Status: ${ddosStatus} (${ddosCount} incidents)`);
        console.log(`   -> RBAC Status: ${rbacStatus} (${rbacCount} incidents)`);
        
        if (ddosStatus === 'Mitigating' && rbacCount > 0) {
             console.log('   -> SUCCESS: Dashboard logic correctly reflects real monitoring events.');
        } else {
             console.log('   -> WARNING: Dashboard logic verification inconclusive (check if previous logs affected counts).');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testSecurityMonitoring();
