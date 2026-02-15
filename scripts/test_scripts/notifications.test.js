const { sendOTP, sendNotification } = require('../../budolpay-0.1.0/packages/notifications');

// Mock Prisma
jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            systemSettings: {
                findUnique: jest.fn().mockResolvedValue({
                    id: 'default',
                    emailProvider: 'CONSOLE',
                    smsProvider: 'CONSOLE',
                }),
            },
        })),
    };
});

describe('Notification Package', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('sendOTP should work with CONSOLE provider', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        await sendOTP('09123456789', '123456', 'SMS');
        
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[SMS CONSOLE]'));
        consoleSpy.mockRestore();
    });

    test('sendNotification should work with CONSOLE provider', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        await sendNotification('test@example.com', 'Test Subject', 'Test Message', 'EMAIL');
        
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[EMAIL CONSOLE]'));
        consoleSpy.mockRestore();
    });
});
