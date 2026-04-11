const request = require('supertest');
const { app } = require('../../services/transaction-service/index');
const { prisma } = require('@budolpay/database');
// const { TransactionStatus, UserRole } = require('@prisma/client');

/**
 * Institutional Resolution Protocol E2E Test Suite (v2.4.3)
 * Validates the Four-Eyes Principle (Maker-Checker) for manual resolution.
 */
describe('Institutional Resolution Protocol (Maker-Checker)', () => {
    let sender: any;
    let receiver: any;
    let manager: any;
    let generalManager: any;
    let transaction: any;

    beforeAll(async () => {
        // 1. Setup Institutional Roles & Test Users
        sender = await prisma.user.upsert({
            where: { email: 'sender.e2e@budolpay.com' },
            update: { kycTier: 'FULLY_VERIFIED', role: 'USER' },
            create: {
                email: 'sender.e2e@budolpay.com',
                firstName: 'Sender',
                lastName: 'E2E',
                passwordHash: 'vault_hash',
                phoneNumber: '+639111111111',
                kycTier: 'FULLY_VERIFIED',
                role: 'USER'
            }
        });

        receiver = await prisma.user.upsert({
            where: { email: 'receiver.e2e@budolpay.com' },
            update: { role: 'USER' },
            create: {
                email: 'receiver.e2e@budolpay.com',
                firstName: 'Receiver',
                lastName: 'E2E',
                passwordHash: 'vault_hash',
                phoneNumber: '+639222222222',
                role: 'USER'
            }
        });

        manager = await prisma.user.upsert({
            where: { email: 'manager.e2e@budolpay.com' },
            update: { role: 'MANAGER' },
            create: {
                email: 'manager.e2e@budolpay.com',
                firstName: 'Institutional',
                lastName: 'Manager',
                passwordHash: 'vault_hash',
                phoneNumber: '+639333333333',
                role: 'MANAGER'
            }
        });

        generalManager = await prisma.user.upsert({
            where: { email: 'gm.e2e@budolpay.com' },
            update: { role: 'GENERAL_MANAGER' },
            create: {
                email: 'gm.e2e@budolpay.com',
                firstName: 'Chief',
                lastName: 'Operations',
                passwordHash: 'vault_hash',
                phoneNumber: '+639444444444',
                role: 'GENERAL_MANAGER'
            }
        });

        // Ensure wallet exists for balance checks
        await prisma.wallet.upsert({
            where: { userId: sender.id },
            update: { balance: 1000000 },
            create: { userId: sender.id, balance: 1000000 }
        });

        await prisma.wallet.upsert({
            where: { userId: receiver.id },
            update: { balance: 0 },
            create: { userId: receiver.id, balance: 0 }
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('Step 1: Trigger a Flagged Transaction (High Value)', async () => {
        // Create a transaction that triggers HVT (PHP 550,000)
        // Since we are testing /resolve, we directly create a FLAGGED_REVIEW tx
        transaction = await prisma.transaction.create({
            data: {
                senderId: sender.id,
                receiverId: receiver.id,
                amount: 550000,
                type: 'P2P_TRANSFER',
                status: 'FLAGGED_REVIEW',
                referenceId: `E2E-RESOLUTION-${Date.now()}`,
                description: 'Institutional E2E Test Flag',
                riskScore: 85,
                riskMetadata: { flags: ['HVT'] }
            }
        });

        expect(transaction.status).toBe('FLAGGED_REVIEW');
    });

    it('Step 2: MANAGER (Maker) Proposes Approval', async () => {
        const response = await request(app)
            .post('/resolve')
            .send({
                transactionId: transaction.id,
                action: 'APPROVE',
                reason: 'KYC Verified - Legitimate high-value transfer.',
                adminId: manager.id,
                adminRole: 'MANAGER'
            });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('PROPOSED');

        // Verify state: Status should NOT change, metadata should store proposal
        const updatedTx = await prisma.transaction.findUnique({ where: { id: transaction.id } });
        expect(updatedTx?.status).toBe('FLAGGED_REVIEW');
        expect((updatedTx?.riskMetadata as any).proposedAction).toBe('APPROVE');
        expect((updatedTx?.riskMetadata as any).proposedBy).toBe(manager.id);
    });

    it('Step 3: GENERAL_MANAGER (Checker) Authorizes Resolution', async () => {
        const response = await request(app)
            .post('/resolve')
            .send({
                transactionId: transaction.id,
                action: 'APPROVE',
                reason: 'Final institutional clearance granted.',
                adminId: generalManager.id,
                adminRole: 'GENERAL_MANAGER'
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('authorized');

        // Verify state: Status should be COMPLETED
        const finalizedTx = await prisma.transaction.findUnique({ 
            where: { id: transaction.id },
            include: { sender: { include: { wallet: true } }, receiver: { include: { wallet: true } } }
        });
        
        expect(finalizedTx?.status).toBe('COMPLETED');
        expect((finalizedTx?.riskMetadata as any).resolution).toBe('APPROVED');
        expect((finalizedTx?.riskMetadata as any).authorizedBy).toBe(generalManager.id);

        // Verify fund movement
        const senderWallet = await prisma.wallet.findUnique({ where: { userId: sender.id } });
        const receiverWallet = await prisma.wallet.findUnique({ where: { userId: receiver.id } });

        // Original 1,000,000 - 550,000 = 450,000
        expect(Number(senderWallet?.balance)).toBe(450000);
        expect(Number(receiverWallet?.balance)).toBe(550000);
    });

    it('Step 4: Forensic Audit Trail Integrity', async () => {
        const auditLogs = await prisma.auditLog.findMany({
            where: { entityId: transaction.id },
            orderBy: { createdAt: 'asc' }
        });

        // 1. PROPOSED
        // 2. AUTHORIZED
        expect(auditLogs.length).toBeGreaterThanOrEqual(2);
        
        const proposalLog = auditLogs.find(l => l.action === 'TX_RESOLUTION_PROPOSED');
        const authorizationLog = auditLogs.find(l => l.action === 'TX_RESOLUTION_AUTHORIZED');

        expect(proposalLog).toBeDefined();
        expect(authorizationLog).toBeDefined();
        expect(proposalLog?.userId).toBe(manager.id);
        expect(authorizationLog?.userId).toBe(generalManager.id);
    });
});
