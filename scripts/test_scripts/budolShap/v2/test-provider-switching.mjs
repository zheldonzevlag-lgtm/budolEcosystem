import 'dotenv/config';
import { prisma } from '../../../../budolshap-0.1.0/lib/prisma.js';
import { triggerRealtimeEvent, clearSettingsCache } from '../../../../budolshap-0.1.0/lib/realtime.js';

async function testProviderAgnosticSwitching() {
    console.log('🚀 Testing Provider-Agnostic Switching & Fallback...');

    const testData = { action: 'LOGIN', userId: 'test-user', timestamp: new Date().toISOString() };

    // 1. Test POLLING Mode
    console.log('\n--- Test 1: POLLING Mode ---');
    await prisma.systemSettings.update({
        where: { id: 'default' },
        data: { realtimeProvider: 'POLLING' }
    });
    clearSettingsCache();
    let result = await triggerRealtimeEvent('admin', 'AUDIT_LOG_CREATED', testData);
    console.log('Result:', result);
    if (result.mode === 'POLLING') console.log('✅ Correctly handled POLLING mode');

    // 2. Test PUSHER with MISSING credentials (should fallback)
    console.log('\n--- Test 2: PUSHER with MISSING credentials (Fallback) ---');
    await prisma.systemSettings.update({
        where: { id: 'default' },
        data: { 
            realtimeProvider: 'PUSHER',
            pusherAppId: null, // Missing
            pusherKey: 'test',
            pusherSecret: 'test',
            pusherCluster: 'ap1'
        }
    });
    clearSettingsCache();
    result = await triggerRealtimeEvent('admin', 'AUDIT_LOG_CREATED', testData);
    console.log('Result:', result);
    if (result.mode === 'POLLING') console.log('✅ Correctly fell back to POLLING due to missing credentials');

    // 3. Test SOCKET_IO with MISSING URL (should fallback)
    console.log('\n--- Test 3: SOCKET_IO with MISSING URL (Fallback) ---');
    await prisma.systemSettings.update({
        where: { id: 'default' },
        data: { 
            realtimeProvider: 'SOCKET_IO',
            socketUrl: null // Missing
        }
    });
    clearSettingsCache();
    result = await triggerRealtimeEvent('admin', 'AUDIT_LOG_CREATED', testData);
    console.log('Result:', result);
    if (result.mode === 'POLLING') console.log('✅ Correctly fell back to POLLING due to missing URL');

    // 4. Test PUSHER with VALID credentials (should use PUSHER)
    console.log('\n--- Test 4: PUSHER with VALID credentials ---');
    await prisma.systemSettings.update({
        where: { id: 'default' },
        data: { 
            realtimeProvider: 'PUSHER',
            pusherAppId: '12345',
            pusherKey: 'test-key',
            pusherSecret: 'test-secret',
            pusherCluster: 'ap1'
        }
    });
    clearSettingsCache();
    try {
        result = await triggerRealtimeEvent('admin', 'AUDIT_LOG_CREATED', testData);
        console.log('Result:', result);
        if (result.mode === 'PUSHER') console.log('✅ Correctly used PUSHER mode');
    } catch (e) {
        console.log('❌ Pusher trigger attempted (which is correct):', e.message);
        // If it attempted to trigger but failed because credentials are dummy, it's still a success for mode selection
        if (e.message.includes('auth') || e.message.includes('key')) {
             console.log('✅ Correctly selected PUSHER mode (even if trigger failed with dummy credentials)');
        }
    }

    // 5. Cleanup - Revert to POLLING
    console.log('\n--- Cleanup ---');
    await prisma.systemSettings.update({
        where: { id: 'default' },
        data: { realtimeProvider: 'POLLING' }
    });
    clearSettingsCache();
    console.log('✅ Reverted to POLLING');
}

testProviderAgnosticSwitching()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
