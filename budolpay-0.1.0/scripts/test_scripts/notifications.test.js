const { sendOTP, sendNotification } = require('../../packages/notifications');

// Mock Prisma
jest.mock('@budolpay/database', () => {
    return {
        prisma: {
            systemSetting: {
                findMany: jest.fn().mockResolvedValue([
                    { key: 'emailProvider', value: 'CONSOLE', isActive: true },
                    { key: 'smsProvider', value: 'CONSOLE', isActive: true },
                ]),
            },
        },
    };
});

describe('Notification Package', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('sendOTP should work with CONSOLE provider', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        await sendOTP('09123456789', '123456', 'SMS');
        
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[CONSOLE SMS]'));
        consoleSpy.mockRestore();
    });

    test('sendNotification should work with CONSOLE provider', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        // Use a fake email to trigger the console output for SMS
        await sendNotification('09123456789', 'Test Subject', 'Test Message', 'SMS');
        
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[CONSOLE SMS]'));
        consoleSpy.mockRestore();
    });
});
