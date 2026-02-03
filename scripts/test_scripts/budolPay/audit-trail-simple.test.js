
const { prisma } = require('d:/IT Projects/budolEcosystem/budolpay-0.1.0/packages/database/index.js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../budolpay-0.1.0/.env') });

describe('Forensic Audit Trail Verification', () => {
    let testUser;

    beforeAll(async () => {
        const randomSuffix = Math.floor(Math.random() * 10000);
        testUser = await prisma.user.create({
            data: {
                email: `jest-audit-${randomSuffix}@budolpay.com`,
                firstName: 'Jest',
                lastName: 'Audit',
                passwordHash: 'hashed_password',
                phoneNumber: `+639${randomSuffix.toString().padStart(8, '0')}`,
                role: 'STAFF'
            }
        });
    });

    afterAll(async () => {
        if (testUser) {
            await prisma.auditLog.deleteMany({
                where: { userId: testUser.id }
            });
            await prisma.user.delete({
                where: { id: testUser.id }
            });
        }
        await prisma.$disconnect();
    });

    test('should create an audit log with correct compliance metadata', async () => {
        const action = 'TEST_AUDIT_ACTION';
        const metadata = {
            detail: 'Testing compliance metadata via Jest',
            compliance: {
                pci_dss: '10.2.2',
                bsp: 'Circular 808'
            }
        };

        const log = await prisma.auditLog.create({
            data: {
                userId: testUser.id,
                action: action,
                entity: 'TestingUnit',
                entityId: testUser.id,
                ipAddress: '127.0.0.1',
                metadata: metadata
            }
        });

        expect(log).toBeDefined();
        expect(log.action).toBe(action);
        expect(log.metadata.compliance.pci_dss).toBe('10.2.2');
        expect(log.metadata.compliance.bsp).toBe('Circular 808');
    });

    test('should retrieve audit logs including user information', async () => {
        const logs = await prisma.auditLog.findMany({
            where: { userId: testUser.id },
            include: { user: true }
        });

        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0].user).toBeDefined();
        expect(logs[0].user.email).toBe(testUser.email);
    });
});
