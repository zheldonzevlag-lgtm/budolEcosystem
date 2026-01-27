const { ROLES, PERMISSIONS, hasPermission } = require('../../budolpay-0.1.0/packages/database/rbac-config');

function testRBAC() {
    console.log('🛡️ Verifying RBAC v339 Implementation...\n');

    const testCases = [
        { role: ROLES.USER, permission: PERMISSIONS.WALLET_READ, expected: true },
        { role: ROLES.USER, permission: PERMISSIONS.WALLET_ADMIN_ADJUST, expected: false },
        { role: ROLES.ADMIN, permission: PERMISSIONS.WALLET_ADMIN_ADJUST, expected: true },
        { role: ROLES.ADMIN, permission: PERMISSIONS.SYSTEM_CONFIG, expected: true },
        { role: ROLES.STAFF, permission: PERMISSIONS.KYC_APPROVE, expected: true },
        { role: ROLES.STAFF, permission: PERMISSIONS.SYSTEM_CONFIG, expected: false },
        { role: ROLES.DRIVER, permission: PERMISSIONS.WALLET_TRANSFER, expected: false },
        { role: 'NON_EXISTENT_ROLE', permission: PERMISSIONS.WALLET_READ, expected: false }
    ];

    let allPassed = true;

    testCases.forEach((tc, index) => {
        const result = hasPermission(tc.role, tc.permission);
        const status = result === tc.expected ? '✅ PASS' : '❌ FAIL';
        if (result !== tc.expected) allPassed = false;
        
        console.log(`[Test ${index + 1}] Role: ${String(tc.role).padEnd(10)} | Permission: ${String(tc.permission).padEnd(20)} | Expected: ${tc.expected} | Result: ${result} | ${status}`);
    });

    console.log('\n--------------------------------------------------');
    if (allPassed) {
        console.log('🚀 RBAC PERMISSION MAPPING IS CORRECT!');
    } else {
        console.log('⚠️ RBAC PERMISSION MAPPING HAS ERRORS!');
        process.exit(1);
    }
}

testRBAC();