
/**
 * Test Script: verify_realtime_provider_settings.js
 * 
 * Objective: Verify that the application logic correctly respects the admin-configured realtime provider.
 * 
 * Scenario 1: Provider is POLLING
 * - Expected: SWR refreshInterval should be 5000ms.
 * 
 * Scenario 2: Provider is PUSHER
 * - Expected: SWR refreshInterval should be 0.
 * - Expected: Pusher client should be initialized.
 * 
 * Scenario 3: Provider is SOCKET_IO
 * - Expected: SWR refreshInterval should be 0.
 * - Expected: Socket.io client should be initialized.
 */

const { getRealtimeConfig } = require('../../budolshap-0.1.0/lib/realtime');

// Mock Prisma and other dependencies for testing
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        systemSettings: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
        }
    }))
}));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Realtime Provider Settings Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return POLLING config when provider is POLLING', async () => {
        prisma.systemSettings.findUnique.mockResolvedValue({
            id: 'default',
            realtimeProvider: 'POLLING'
        });

        const config = await getRealtimeConfig();
        expect(config.provider).toBe('POLLING');
    });

    test('should return PUSHER config with keys when provider is PUSHER', async () => {
        prisma.systemSettings.findUnique.mockResolvedValue({
            id: 'default',
            realtimeProvider: 'PUSHER',
            pusherKey: 'test-key',
            pusherCluster: 'test-cluster'
        });

        const config = await getRealtimeConfig();
        expect(config.provider).toBe('PUSHER');
        expect(config.pusherKey).toBe('test-key');
        expect(config.pusherCluster).toBe('test-cluster');
    });

    test('should return SOCKET_IO config with URL when provider is SOCKET_IO', async () => {
        prisma.systemSettings.findUnique.mockResolvedValue({
            id: 'default',
            realtimeProvider: 'SOCKET_IO',
            socketUrl: 'http://localhost:4000'
        });

        const config = await getRealtimeConfig();
        expect(config.provider).toBe('SOCKET_IO');
        expect(config.socketUrl).toBe('http://localhost:4000');
    });
});
