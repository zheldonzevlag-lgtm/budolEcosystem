
import { getSystemSettings } from '../settings';
import { prisma } from '../prisma';

// Mock prisma
jest.mock('../prisma', () => ({
    prisma: {
        systemSettings: {
            findUnique: jest.fn(),
            create: jest.fn()
        }
    }
}));

describe('System Settings Normalization', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should normalize legacy GOOGLE provider ID to GOOGLE_MAPS', async () => {
        // Mock DB returning legacy 'GOOGLE'
        prisma.systemSettings.findUnique.mockResolvedValue({
            id: 'default',
            mapProvider: 'GOOGLE',
            enabledMapProviders: ['OSM', 'GOOGLE'],
            googleMapsApiKey: 'test-key'
        });

        const settings = await getSystemSettings(true);

        expect(settings.mapProvider).toBe('GOOGLE_MAPS');
        expect(settings.enabledMapProviders).toContain('GOOGLE_MAPS');
        expect(settings.enabledMapProviders).toContain('OSM');
        expect(settings.enabledMapProviders).not.toContain('GOOGLE');
    });

    test('should keep GOOGLE_MAPS if already correct', async () => {
        // Mock DB returning correct 'GOOGLE_MAPS'
        prisma.systemSettings.findUnique.mockResolvedValue({
            id: 'default',
            mapProvider: 'GOOGLE_MAPS',
            enabledMapProviders: ['OSM', 'GOOGLE_MAPS'],
            googleMapsApiKey: 'test-key'
        });

        const settings = await getSystemSettings(true);

        expect(settings.mapProvider).toBe('GOOGLE_MAPS');
        expect(settings.enabledMapProviders).toContain('GOOGLE_MAPS');
    });

    test('should handle missing enabledMapProviders', async () => {
         // Mock DB returning null enabledMapProviders
         prisma.systemSettings.findUnique.mockResolvedValue({
            id: 'default',
            mapProvider: 'OSM',
            enabledMapProviders: null
        });

        const settings = await getSystemSettings(true);
        // Should not crash
        expect(settings.mapProvider).toBe('OSM');
    });
});
