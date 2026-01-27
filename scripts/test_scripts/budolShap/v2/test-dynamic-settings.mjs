import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDynamicSettings() {
    console.log('🚀 Testing Dynamic System Settings (Direct DB Access)...');

    try {
        // 1. Fetch/Create Initial Settings
        console.log('\n1. Fetching current settings...');
        let settings = await prisma.systemSettings.findUnique({ where: { id: "default" } });

        if (!settings) {
            console.log('No settings found, creating default...');
            settings = await prisma.systemSettings.create({
                data: {
                    id: "default",
                    realtimeProvider: "POLLING",
                    sessionTimeout: 15,
                    sessionWarning: 1
                }
            });
        }

        console.log('Current Settings:', {
            sessionTimeout: settings.sessionTimeout,
            sessionWarning: settings.sessionWarning
        });

        // 2. Update Settings
        console.log('\n2. Updating settings to: Timeout=30m, Warning=5m...');
        const updated = await prisma.systemSettings.update({
            where: { id: "default" },
            data: {
                sessionTimeout: 30,
                sessionWarning: 5
            }
        });

        if (updated.sessionTimeout === 30 && updated.sessionWarning === 5) {
            console.log('✅ Update Successful!');
        } else {
            console.error('❌ Update Failed:', updated);
            process.exit(1);
        }

        // 3. Revert to Defaults
        console.log('\n3. Reverting to defaults (15m/1m)...');
        await prisma.systemSettings.update({
            where: { id: "default" },
            data: {
                sessionTimeout: 15,
                sessionWarning: 1
            }
        });
        console.log('✅ Reverted successfully.');

        console.log('\n✨ DYNAMIC SETTINGS DB INTEGRATION PASSED');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testDynamicSettings();
