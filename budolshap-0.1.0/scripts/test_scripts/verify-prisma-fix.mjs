import { updateSystemSettings, getSystemSettings } from '../../lib/settings.js';
import { prisma } from '../../lib/prisma.js';

async function verifyFix() {
    console.log('🚀 Verifying Prisma Upsert Fix...');

    try {
        // 1. Delete existing settings to force a 'create' in upsert
        console.log('\n1. Deleting existing settings...');
        await prisma.systemSettings.deleteMany({
            where: { id: "default" }
        });
        console.log('✅ Settings deleted.');

        // 2. Call updateSystemSettings with partial data
        console.log('\n2. Calling updateSystemSettings with partial data (map settings)...');
        const partialData = {
            mapProvider: "GEOAPIFY",
            enabledMapProviders: ["OSM", "GEOAPIFY"],
            geoapifyApiKey: "test-api-key-123"
        };

        const settings = await updateSystemSettings(partialData);
        console.log('✅ updateSystemSettings succeeded!');
        console.log('Resulting Settings:', {
            id: settings.id,
            mapProvider: settings.mapProvider,
            realtimeProvider: settings.realtimeProvider, // Should be default "POLLING"
            sessionTimeout: settings.sessionTimeout, // Should be default 15
        });

        if (settings.mapProvider === "GEOAPIFY" && settings.realtimeProvider === "POLLING") {
            console.log('\n✨ VERIFICATION PASSED: Partial data merged with defaults successfully.');
        } else {
            console.error('\n❌ VERIFICATION FAILED: Data mismatch.');
        }

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED with error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyFix();
