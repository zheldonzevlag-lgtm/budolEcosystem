const { checkRateLimit } = require('./rate-limit-logic');

// Mock Prisma
const prismaMock = {
    rateLimit: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
    },
};

describe('Rate Limiting Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should allow the first hit and create a record', async () => {
        prismaMock.rateLimit.findUnique.mockResolvedValue(null);
        prismaMock.rateLimit.upsert.mockResolvedValue({ key: 'test-key', hits: 1 });

        const result = await checkRateLimit(prismaMock, 'test-key', 5, 60);

        expect(result.success).toBe(true);
        expect(result.remaining).toBe(4);
        expect(prismaMock.rateLimit.upsert).toHaveBeenCalled();
    });

    test('should block when limit is exceeded', async () => {
        const expiresAt = new Date(Date.now() + 60000);
        prismaMock.rateLimit.findUnique.mockResolvedValue({
            key: 'test-key',
            hits: 5,
            expiresAt: expiresAt,
        });

        const result = await checkRateLimit(prismaMock, 'test-key', 5, 60);

        expect(result.success).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.reset).toEqual(expiresAt);
    });

    test('should increment hits if within limit', async () => {
        const expiresAt = new Date(Date.now() + 60000);
        prismaMock.rateLimit.findUnique.mockResolvedValue({
            key: 'test-key',
            hits: 2,
            expiresAt: expiresAt,
        });
        prismaMock.rateLimit.update.mockResolvedValue({
            key: 'test-key',
            hits: 3,
        });

        const result = await checkRateLimit(prismaMock, 'test-key', 5, 60);

        expect(result.success).toBe(true);
        expect(result.remaining).toBe(2);
        expect(prismaMock.rateLimit.update).toHaveBeenCalled();
    });

    test('should reset if expired', async () => {
        const expiredDate = new Date(Date.now() - 1000);
        prismaMock.rateLimit.findUnique.mockResolvedValue({
            key: 'test-key',
            hits: 5,
            expiresAt: expiredDate,
        });
        prismaMock.rateLimit.upsert.mockResolvedValue({ key: 'test-key', hits: 1 });

        const result = await checkRateLimit(prismaMock, 'test-key', 5, 60);

        expect(result.success).toBe(true);
        expect(result.remaining).toBe(4);
        expect(prismaMock.rateLimit.upsert).toHaveBeenCalled();
    });
});
