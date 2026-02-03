
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../budolpay-0.1.0/.env') });
const { prisma } = require('d:/IT Projects/budolEcosystem/budolpay-0.1.0/packages/database/index.js');

async function simulateRoleUpdate() {
    console.log('--- Phase 5: End-to-End Live Action Logging Verification ---');
    
    try {
        // 1. Find a test user or create one
        let testUser = await prisma.user.findFirst({
            where: { email: 'audit-test@budolpay.com' }
        });

        if (!testUser) {
            console.log('Creating test user...');
            const randomSuffix = Math.floor(Math.random() * 10000);
            testUser = await prisma.user.create({
                data: {
                    email: `audit-test-${randomSuffix}@budolpay.com`,
                    firstName: 'Audit',
                    lastName: 'Tester',
                    passwordHash: 'hashed_password',
                    phoneNumber: `+639${randomSuffix.toString().padStart(8, '0')}`,
                    role: 'STAFF'
                }
            });
        }

        console.log(`Simulating role update for user: ${testUser.email}`);

        // 2. Simulate the action that triggers an audit log
        // In a real app, this would be an API call to auth-service or admin-app.
        // Here we manually create the log to verify the structure matches what's expected by the UI.
        
        const action = 'ROLE_UPDATED';
        const metadata = {
            previousRole: testUser.role,
            newRole: 'ADMIN',
            updatedBy: 'system-test',
            compliance: {
                pci_dss: '10.2.2',
                bsp: 'Circular 808'
            }
        };

        const newLog = await prisma.auditLog.create({
            data: {
                userId: testUser.id,
                action: action,
                entity: 'UserManagement',
                entityId: testUser.id,
                ipAddress: '127.0.0.1',
                userAgent: 'Jest-Test-Suite',
                metadata: metadata,
                createdAt: new Date()
            },
            include: {
                user: true
            }
        });

        console.log('SUCCESS: Audit log created with ID:', newLog.id);
        console.log('Action:', newLog.action);
        console.log('Compliance Metadata:', JSON.stringify(newLog.metadata.compliance));

        // 3. Verify it shows up in the latest logs
        const latestLogs = await prisma.auditLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: true }
        });

        const found = latestLogs.some(log => log.id === newLog.id);
        if (found) {
            console.log('VERIFIED: New log is present in the latest audit trail.');
        } else {
            throw new Error('Log not found in latest audit trail!');
        }

        // Clean up test user (optional)
        // await prisma.user.delete({ where: { id: testUser.id } });

    } catch (error) {
        console.error('FAILED:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

simulateRoleUpdate();
