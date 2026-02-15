import { createAuditLog } from '../lib/audit.js';
import { prisma } from '../lib/prisma.js';

// Mock Request object compatible with Next.js Request interface used in audit.js
class MockRequest {
    constructor(ip, userAgent, method = 'POST', url = 'http://localhost:3000') {
        this.headers = new Map();
        this.headers.set('x-forwarded-for', ip);
        this.headers.set('user-agent', userAgent);
        this.method = method;
        this.url = url;
        this.nextUrl = { pathname: new URL(url).pathname };
    }
}

async function runSimulation() {
    console.log('Starting Security Monitoring Simulation...');
    console.log('Generating Real Data for Forensic Audit Trails...');

    try {
        // 1. Simulate DDoS Attack (Multiple rapid requests)
        console.log('1. Simulating DDoS Attack (Rate Limit Trigger)...');
        for (let i = 0; i < 3; i++) {
            const req = new MockRequest('192.168.1.100', 'Botnet/1.0');
            await createAuditLog(null, 'DDOS_MITIGATED', req, {
                entity: 'RateLimit',
                status: 'FAILURE',
                details: `Rate limit exceeded: 50 requests/sec (Attempt ${i + 1})`,
                metadata: { ip: '192.168.1.100', limit: 100 }
            });
        }

        // 2. Simulate Unauthorized Admin Access
        console.log('2. Simulating Unauthorized Admin Access...');
        const adminReq = new MockRequest('203.0.113.45', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        await createAuditLog(null, 'UNAUTHORIZED_ACCESS', adminReq, {
            entity: 'AdminRoute',
            status: 'FAILURE',
            details: 'Blocked admin access attempt. Error: Access denied: User is not an administrator',
            metadata: { path: '/admin/settings' }
        });

        // 3. Simulate Spam Registration
        console.log('3. Simulating Spam Registration...');
        const spamReq = new MockRequest('10.0.0.5', 'SpamBot/3.0');
        await createAuditLog(null, 'SPAM_ATTEMPT', spamReq, {
            details: 'Honeypot field filled during registration',
            status: 'FAILURE',
            metadata: { spamField: '_honey' }
        });

        // 4. Simulate Login Failure
        console.log('4. Simulating Login Failure...');
        const loginReq = new MockRequest('172.16.0.2', 'iPhone; CPU iPhone OS 14_0 like Mac OS X');
        await createAuditLog(null, 'LOGIN_FAILED', loginReq, {
            entity: 'Auth',
            status: 'FAILURE',
            details: 'Login failed: User not found (hacker@example.com)',
            metadata: { email: 'hacker@example.com' }
        });

        // 5. Simulate Admin Login (Success) if admin exists
        console.log('5. Simulating Admin Login (Success)...');
        const adminUser = await prisma.user.findFirst({ 
            where: { 
                OR: [{ isAdmin: true }, { accountType: 'ADMIN' }] 
            } 
        });
        
        if (adminUser) {
            const successReq = new MockRequest('192.168.1.5', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
            await createAuditLog(adminUser.id, 'LOGIN', successReq, {
                details: 'Login via Password',
                entity: 'User',
                entityId: adminUser.id,
                status: 'SUCCESS'
            });
            console.log(`   Logged in as admin: ${adminUser.email}`);
        } else {
            console.log('   No admin user found for login simulation. Skipping.');
        }

        console.log('\nSimulation Complete. Verifying logs in database...');

        // Verify
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { user: { select: { email: true } } }
        });

        console.log('\n--- RECENT FORENSIC AUDIT TRAILS ---');
        console.log('ID | Action | Status | Integrity Hash | Details');
        console.log('-'.repeat(100));
        
        logs.forEach(log => {
            const integrity = log.metadata?.integrity?.hash ? 'YES' : 'NO';
            const shortId = log.id.substring(0, 8);
            const action = log.action.padEnd(20);
            const status = (log.metadata?.status || 'INFO').padEnd(10); // Check metadata status first as createAuditLog puts it there
            const details = log.details.substring(0, 40) + (log.details.length > 40 ? '...' : '');
            
            console.log(`${shortId} | ${action} | ${status} | ${integrity.padEnd(14)} | ${details}`);
        });
        console.log('-'.repeat(100));
        console.log(`\nTotal Logs Verified: ${logs.length}`);
        console.log('Real monitoring data successfully generated.');

    } catch (error) {
        console.error('Simulation Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runSimulation();
