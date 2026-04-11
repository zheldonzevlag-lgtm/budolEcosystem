const request = require('supertest');
const { app } = require('../../services/transaction-service/index');
const { prisma } = require('@budolpay/database');

/**
 * Tiered Limits Validation Test Suite (v2.4.4)
 * Verifies that BASIC users honor the 10k wallet and 5k monthly in/out limits.
 */
describe('Tiered Limits Validation (BASIC Tier)', () => {
    let basicUser: any;
    let verifiedUser: any;

    beforeAll(async () => {
        // 1. Setup BASIC User
        basicUser = await prisma.user.upsert({
            where: { email: 'basic.user@budolpay.com' },
            update: { kycTier: 'BASIC', role: 'USER' },
            create: {
                email: 'basic.user@budolpay.com',
                firstName: 'Basic',
                lastName: 'User',
                passwordHash: 'vault_hash',
                phoneNumber: '+639000000001',
                kycTier: 'BASIC',
                role: 'USER'
            }
        });

        // 2. Setup FULLY_VERIFIED User
        verifiedUser = await prisma.user.upsert({
            where: { email: 'verified.user@budolpay.com' },
            update: { kycTier: 'FULLY_VERIFIED', role: 'USER' },
            create: {
                email: 'verified.user@budolpay.com',
                firstName: 'Verified',
                lastName: 'User',
                passwordHash: 'vault_hash',
                phoneNumber: '+639000000002',
                kycTier: 'FULLY_VERIFIED',
                role: 'USER'
            }
        });

        // Ensure clean wallet state
        await prisma.wallet.upsert({
            where: { userId: basicUser.id },
            update: { balance: 0 },
            create: { userId: basicUser.id, balance: 0 }
        });

        await prisma.wallet.upsert({
            where: { userId: verifiedUser.id },
            update: { balance: 100000 },
            create: { userId: verifiedUser.id, balance: 100000 }
        });

        // Clear transactions for these users to ensure clean monthly volume tracking
        // (In a real DB we might need to be more careful, but for E2E this is isolated)
        await prisma.transaction.deleteMany({
            where: { 
                OR: [
                    { senderId: basicUser.id },
                    { receiverId: basicUser.id }
                ]
            }
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Cash-In / Wallet Ceiling (10k)', () => {
        it('FAIL: Should reject Cash-In that exceeds 10k wallet balance', async () => {
            const response = await request(app)
                .post('/cash-in')
                .send({
                    userId: basicUser.id,
                    amount: 10001,
                    provider: '7-ELEVEn'
                });

            expect(response.status).toBe(500);
            expect(response.body.error).toContain('Wallet Limit Exceeded');
        });

        it('PASS: Should allow Cash-In that stays within 10k balance and 5k monthly influx', async () => {
            const response = await request(app)
                .post('/cash-in')
                .send({
                    userId: basicUser.id,
                    amount: 2500,
                    provider: '7-ELEVEn'
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('successful');
        });

        it('FAIL: Should reject Cash-In that exceeds 5k monthly influx even if balance < 10k', async () => {
            // Already did 2,500. Now try 2,600 (Total 5,100)
            const response = await request(app)
                .post('/cash-in')
                .send({
                    userId: basicUser.id,
                    amount: 2600,
                    provider: '7-ELEVEn'
                });

            expect(response.status).toBe(500);
            expect(response.body.error).toContain('Incoming Limit Exceeded');
        });
    });

    describe('P2P / Outbound Monthly (5k)', () => {
        it('PASS: Should allow P2P transfer within 5k monthly limit', async () => {
            // Give user some balance (via DB directly to bypass monthly in check if needed, 
            // but we'll use the 2,500 we already have)
            const response = await request(app)
                .post('/transfer')
                .send({
                    senderId: basicUser.id,
                    receiverId: verifiedUser.id,
                    amount: 1000,
                    description: 'Test P2P'
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('successful');
        });

        it('FAIL: Should reject P2P transfer that exceeds 5k monthly limit', async () => {
            // Already sent 1,000. Try 4,001 (Total 5,001)
            const response = await request(app)
                .post('/transfer')
                .send({
                    senderId: basicUser.id,
                    receiverId: verifiedUser.id,
                    amount: 4001,
                    description: 'Limit Test'
                });

            expect(response.status).toBe(500);
            expect(response.body.error).toContain('Limit Exceeded');
            expect(response.body.error).toContain('monthly outbound limit');
        });
    });

    describe('Verification Status Immunity', () => {
        it('PASS: FULLY_VERIFIED user should NOT be blocked by 5k/10k limits', async () => {
            const response = await request(app)
                .post('/transfer')
                .send({
                    senderId: verifiedUser.id,
                    receiverId: basicUser.id,
                    amount: 15000,
                    description: 'High Value Verified Transfer'
                });

            // Note: If /cash-in was used on basicUser, it might fail here due to basicUser balance ceiling.
            // But transfer should be fine from verifiedUser side until it hits basicUser logic.
            // Actually /transfer logic checks sender limits first.
            
            expect(response.status).toBe(200);
        });
    });
});
