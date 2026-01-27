const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRealtimeConfig() {
    console.log('--- Phase 1 Test: Configuration System ---');

    // 1. Check Default State
    console.log('1. Checking current settings...');
    let settings = await prisma.systemSettings.findUnique({
        where: { id: 'default' }
    });

    if (!settings) {
        console.log('   No settings found. Creating default...');
        settings = await prisma.systemSettings.create({
            data: {
                id: 'default',
                realtimeProvider: 'POLLING'
            }
        });
    }

    console.log(`   Current Provider: ${settings.realtimeProvider}`);
    console.log(`   Pusher Key: ${settings.pusherKey || 'null'}`);

    // 2. Simulate Admin Update to PUSHER
    console.log('\n2. Simulating Update to PUSHER...');
    const updated = await prisma.systemSettings.update({
        where: { id: 'default' },
        data: {
            realtimeProvider: 'PUSHER',
            pusherKey: 'test-key-123',
            pusherCluster: 'ap1'
        }
    });
    console.log(`   New Provider: ${updated.realtimeProvider}`);
    console.log(`   New Key: ${updated.pusherKey}`);

    if (updated.realtimeProvider === 'PUSHER') {
        console.log('   ✅ Update Successful');
    } else {
        console.error('   ❌ Update Failed');
    }

    // 3. Revert to POLLING (Cleanup)
    console.log('\n3. Reverting to POLLING (Cleanup)...');
    const reverted = await prisma.systemSettings.update({
        where: { id: 'default' },
        data: {
            realtimeProvider: 'POLLING'
        }
    });
    console.log(`   Final Provider: ${reverted.realtimeProvider}`);
}

testRealtimeConfig()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
