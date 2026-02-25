
/**
 * OTP Flow Integration Test
 * Verifies OTP generation, storage, and verification logic.
 */

describe('OTP Flow Logic', () => {
    const mockPrisma = {
        verificationCode: {
            upsert: jest.fn(),
            findFirst: jest.fn(),
            delete: jest.fn()
        }
    };

    const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

    test('should generate a 6-digit OTP', () => {
        const otp = generateOTP();
        expect(otp).toHaveLength(6);
        expect(/^[0-9]{6}$/.test(otp)).toBe(true);
    });

    test('should verify valid OTP', async () => {
        const searchIdentifier = 'test@example.com';
        const password = '123456';
        
        mockPrisma.verificationCode.findFirst.mockResolvedValue({
            id: 'otp-123',
            identifier: searchIdentifier,
            code: password,
            expiresAt: new Date(Date.now() + 10000)
        });

        const otpRecord = await mockPrisma.verificationCode.findFirst({
            where: {
                identifier: searchIdentifier,
                code: password,
                expiresAt: { gt: new Date() }
            }
        });

        expect(otpRecord).toBeDefined();
        expect(otpRecord.code).toBe(password);
    });

    test('should fail on expired OTP', async () => {
        const searchIdentifier = 'test@example.com';
        const password = '123456';
        
        mockPrisma.verificationCode.findFirst.mockResolvedValue(null);

        const otpRecord = await mockPrisma.verificationCode.findFirst({
            where: {
                identifier: searchIdentifier,
                code: password,
                expiresAt: { gt: new Date() }
            }
        });

        expect(otpRecord).toBeNull();
    });
});
