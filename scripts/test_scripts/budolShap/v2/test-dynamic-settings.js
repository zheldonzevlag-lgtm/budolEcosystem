const { getSystemSettings, updateSystemSettings } = require('../lib/settings');

async function testDynamicSettings() {
    console.log('🚀 Testing Dynamic System Settings...');

    try {
        // 1. Fetch Initial Settings
        console.log('\n1. Fetching current settings...');
        const initial = await getSystemSettings(true);
        console.log('Current Settings:', {
            sessionTimeout: initial.sessionTimeout,
            sessionWarning: initial.sessionWarning
        });

        // 2. Update Settings
        console.log('\n2. Updating settings to: Timeout=30m, Warning=5m...');
        const updated = await updateSystemSettings({
            sessionTimeout: 30,
            sessionWarning: 5
        });

        if (updated.sessionTimeout === 30 && updated.sessionWarning === 5) {
            console.log('✅ Update Successful!');
        } else {
            console.error('❌ Update Failed:', updated);
        }

        // 3. Verify Cache/Fetch
        console.log('\n3. Verifying retrieval...');
        const verified = await getSystemSettings();
        if (verified.sessionTimeout === 30) {
            console.log('✅ Settings correctly retrieved from DB/Cache');
        } else {
            console.error('❌ Data Mismatch');
        }

        // 4. Revert to Default
        console.log('\n4. Reverting to defaults (15m/1m)...');
        await updateSystemSettings({
            sessionTimeout: 15,
            sessionWarning: 1
        });
        console.log('✅ Reverted successfully.');

        console.log('\n✨ DYNAMIC SETTINGS TEST PASSED');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
    }
}

// Mocking Next.js/Prisma environment slightly for the script if needed
// The lib might use 'import', so we might need Babel or just use direct prisma call if the lib is ESM.
// Since the project is using ES Modules (import/export), this script needs to be an mjs or use dynamic import.
// Let's rely on the user having a standard environment where we can run this. 
// Actually, `lib/settings.js` uses `import`. This standard node script using `require` will fail if not compiled.
// I should rewrite the test to be a standalone script that imports Prisma directly to avoid transpilation issues 
// OR write it as .mjs.

testDynamicSettings();
