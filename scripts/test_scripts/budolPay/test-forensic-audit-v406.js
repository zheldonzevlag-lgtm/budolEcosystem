const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Forensic Audit Trail Verification (v406) ---');
        
        console.log('Prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('_')));
        
        // 1. Find a test user (Admin preferred)
        if (!prisma.user) {
            throw new Error('prisma.user is undefined. Check Prisma client generation.');
        }
        
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        }) || await prisma.user.findFirst();

        if (!admin) {
            console.error('No user found to attribute audit log to.');
            return;
        }

        console.log(`Using Actor: ${admin.email} (ID: ${admin.id})`);

        // 2. Simulate a high-security event: CONFIG_CHANGE
        const eventId = 'AUDIT-' + Date.now();
        const auditEntry = await prisma.auditLog.create({
            data: {
                userId: admin.id,
                action: 'FORENSIC_VERIFICATION',
                ipAddress: '127.0.0.1',
                device: 'Test Runner (Node.js)',
                userAgent: 'Budol-Forensic-v406',
                metadata: {
                    testId: eventId,
                    purpose: 'Verification of audit trail integrity',
                    compliance: {
                        pci_dss: '10.2.2',
                        bsp: 'Circular 808'
                    },
                    payload: {
                        action: 'DATABASE_INTEGRITY_CHECK',
                        status: 'SUCCESS'
                    }
                }
            }
        });

        console.log(`Successfully created Audit Entry: ${auditEntry.id}`);

        // 3. Verify the entry exists and metadata is intact
        const verifiedLog = await prisma.auditLog.findUnique({
            where: { id: auditEntry.id }
        });

        if (verifiedLog && verifiedLog.metadata.testId === eventId) {
            console.log('Verification Success: Audit log persisted with correct metadata.');
            console.log('JSON Metadata retrieved:', JSON.stringify(verifiedLog.metadata, null, 2));
        } else {
            throw new Error('Verification Failed: Log not found or metadata mismatch.');
        }

    } catch (err) {
        console.error('Audit Verification Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
