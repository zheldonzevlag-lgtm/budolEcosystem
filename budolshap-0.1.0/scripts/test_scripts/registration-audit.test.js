
const { POST: registerUser } = require('../../app/api/auth/register/route');
const { POST: verifyOtp } = require('../../app/api/auth/verify-email/route');
const { prisma } = require('../../lib/prisma');
const { createAuditLog } = require('../../lib/audit');

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn()
        },
        auditLog: {
            create: jest.fn()
        }
    }
}));

jest.mock('../../lib/auth', () => ({
    hashPassword: jest.fn().mockResolvedValue('hashed_password'),
    generateEmailToken: jest.fn().mockReturnValue('email_token'),
    generateOTP: jest.fn().mockReturnValue('123456'),
    verifyEmailToken: jest.fn()
}));

jest.mock('../../lib/email', () => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendOTPEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../lib/sms', () => ({
    sendOTPSMS: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../lib/rate-limit', () => ({
    rateLimit: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../../lib/settings', () => ({
    getSystemSettings: jest.fn().mockResolvedValue({})
}));

jest.mock('../../lib/realtime', () => ({
    triggerRealtimeEvent: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../lib/api/budolIdClient', () => ({
    registerWithBudolId: jest.fn().mockResolvedValue({
        userId: 'budol_123',
        fraudAnalysis: { score: 0, risk: 'LOW' }
    })
}));

jest.mock('../../lib/utils/phone-utils', () => ({
    normalizePhone: jest.fn(phone => phone)
}));

jest.mock('../../lib/audit', () => ({
    createAuditLog: jest.fn().mockResolvedValue(true)
}));

// Mock Next.js NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((data, options) => ({ json: () => data, status: options?.status || 200 }))
    }
}));

describe('Registration Audit Logs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should log SECURITY_OTP_SENT for Quick Registration', async () => {
        // Setup request
        const request = {
            json: jest.fn().mockResolvedValue({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                phoneNumber: '09171234567',
                registrationType: 'phone_only'
            }),
            headers: { get: jest.fn() }
        };

        // Mock Prisma responses
        prisma.user.findUnique.mockResolvedValue(null); // User doesn't exist
        prisma.user.create.mockResolvedValue({
            id: 'budol_123',
            name: 'Test User',
            email: 'test@example.com',
            emailVerified: false,
            accountType: 'BUYER'
        });

        // Execute registration
        await registerUser(request);

        // Verify logs
        expect(createAuditLog).toHaveBeenCalledTimes(2);
        
        // 1. Check for USER_REGISTERED (standard log)
        expect(createAuditLog).toHaveBeenCalledWith(
            'budol_123',
            'USER_REGISTERED',
            expect.anything(),
            expect.objectContaining({
                details: expect.stringContaining('Quick Reg')
            })
        );

        // 2. Check for SECURITY_OTP_SENT (new forensic log)
        expect(createAuditLog).toHaveBeenCalledWith(
            'budol_123',
            'SECURITY_OTP_SENT',
            expect.anything(),
            expect.objectContaining({
                status: 'SUCCESS',
                metadata: expect.objectContaining({
                    type: 'DUAL_CHANNEL',
                    phone: '09171234567'
                })
            })
        );
    });

    test('should log SECURITY_OTP_VERIFIED when verifying via OTP', async () => {
        // Setup request
        const request = {
            json: jest.fn().mockResolvedValue({
                email: 'test@example.com',
                otp: '123456'
            }),
            headers: { get: jest.fn() },
            url: 'http://localhost/api/auth/verify-email'
        };

        // Mock Prisma responses
        prisma.user.findFirst.mockResolvedValue({
            id: 'budol_123',
            email: 'test@example.com',
            emailVerifyToken: '123456'
        });
        prisma.user.update.mockResolvedValue({
            id: 'budol_123',
            emailVerified: true
        });

        // Execute verification
        await verifyOtp(request);

        // Verify log
        expect(createAuditLog).toHaveBeenCalledWith(
            'budol_123',
            'SECURITY_OTP_VERIFIED',
            expect.anything(),
            expect.objectContaining({
                status: 'SUCCESS',
                details: 'Account verified successfully via OTP',
                metadata: expect.objectContaining({
                    method: 'OTP'
                })
            })
        );
    });
});
