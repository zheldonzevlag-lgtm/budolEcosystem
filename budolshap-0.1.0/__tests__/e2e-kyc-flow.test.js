import { prisma } from '../lib/prisma';

/**
 * E2E Simulation of KYC Journey
 * This test simulates the sequence of actions a user takes from submission to approval.
 */

describe('E2E KYC Journey Simulation', () => {
    let testUser;

    beforeAll(async () => {
        // Create a fresh test user
        const uniqueId = `e2e-user-${Date.now()}`;
        testUser = await prisma.user.create({
            data: {
                id: uniqueId,
                name: 'E2E Test User',
                email: `e2e-kyc-${Date.now()}@example.com`,
                password: 'hashed-password',
                phoneNumber: `+639${Date.now().toString().slice(-9)}`, // Unique phone
                image: 'https://example.com/default-avatar.png',
                kycStatus: 'UNVERIFIED'
            }
        });
    });

    afterAll(async () => {
        // Cleanup
        await prisma.auditLog.deleteMany({ where: { userId: testUser.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
    });

    test('Full Journey: Submission -> Audit -> Verification', async () => {
        // 1. User submits KYC (Simulated API Call)
        const submissionDetails = {
            tier: 'INDIVIDUAL',
            fullName: 'E2E Test User',
            idType: 'PASSPORT',
            idNumber: 'E2E-12345',
            auditInfo: { ip: '127.0.0.1', userAgent: 'Jest-E2E' }
        };

        const submittedUser = await prisma.user.update({
            where: { id: testUser.id },
            data: {
                kycStatus: 'PENDING',
                kycDetails: {
                    ...submissionDetails,
                    submittedAt: new Date().toISOString()
                }
            }
        });

        // Simulate API side-effect: Create Audit Log
        await prisma.auditLog.create({
            data: {
                userId: testUser.id,
                action: 'KYC_SUBMISSION',
                metadata: { tier: 'INDIVIDUAL', ip: '127.0.0.1' }
            }
        });

        expect(submittedUser.kycStatus).toBe('PENDING');

        // 2. Audit Log is created
        const log = await prisma.auditLog.findFirst({
            where: { userId: testUser.id, action: 'KYC_SUBMISSION' }
        });
        expect(log).toBeDefined();
        expect(log.metadata.tier).toBe('INDIVIDUAL');

        // 3. Admin Reviews & Approves (Simulated Admin Action)
        const approvedUser = await prisma.user.update({
            where: { id: testUser.id },
            data: {
                kycStatus: 'VERIFIED',
                kycDetails: {
                    ...submittedUser.kycDetails,
                    approvedAt: new Date().toISOString(),
                    approvedBy: 'SYSTEM_ADMIN'
                }
            }
        });

        expect(approvedUser.kycStatus).toBe('VERIFIED');

        // 4. Verification Log is created
        await prisma.auditLog.create({
            data: {
                userId: testUser.id,
                action: 'KYC_APPROVED',
                metadata: { approvedBy: 'SYSTEM_ADMIN' }
            }
        });

        const approveLog = await prisma.auditLog.findFirst({
            where: { userId: testUser.id, action: 'KYC_APPROVED' }
        });
        expect(approveLog).toBeDefined();
    });

    test('Restriction Enforcement: High-value transaction blocked for UNVERIFIED', async () => {
        // Import restriction logic (simulated since we are in Node)
        const { validateTransactionLimit } = require('../lib/compliance');
        
        const unverifiedStatus = 'UNVERIFIED';
        const highAmount = 15000; // Above 10k limit

        const result = validateTransactionLimit(unverifiedStatus, highAmount);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('exceeds limit');
    });

    test('Restriction Enforcement: High-value transaction allowed for VERIFIED', async () => {
        const { validateTransactionLimit } = require('../lib/compliance');
        
        const verifiedStatus = 'VERIFIED';
        const highAmount = 15000;

        const result = validateTransactionLimit(verifiedStatus, highAmount);
        expect(result.allowed).toBe(true);
    });
});
