const { prisma } = require('../../../budolpay-0.1.0/packages/database');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../budolpay-0.1.0/.env') });

async function testKycFix() {
    console.log('--- KYC Status Enum Validation Test (v485) ---');
    
    // 1. Find a test user
    const user = await prisma.user.findFirst({
        where: { email: { contains: '@' } }
    });

    if (!user) {
        console.error('No test user found in database.');
        return;
    }

    console.log(`Using test user: ${user.email} (ID: ${user.id})`);

    // 2. Test invalid enum value 'APPROVED'
    console.log('\nTesting invalid enum value: "APPROVED"...');
    try {
        await prisma.user.update({
            where: { id: user.id },
            data: { kycStatus: 'APPROVED' }
        });
        console.error('FAILED: Prisma allowed invalid enum value "APPROVED"');
    } catch (err) {
        console.log('SUCCESS: Prisma correctly rejected invalid enum value "APPROVED"');
        // console.log('Error message:', err.message.split('\n')[0]);
    }

    // 3. Test valid enum value 'VERIFIED'
    console.log('\nTesting valid enum value: "VERIFIED"...');
    try {
        await prisma.user.update({
            where: { id: user.id },
            data: { kycStatus: 'VERIFIED' }
        });
        console.log('SUCCESS: Prisma accepted valid enum value "VERIFIED"');
    } catch (err) {
        console.error('FAILED: Prisma rejected valid enum value "VERIFIED"');
        console.error(err);
    }

    // 4. Reset user status for safety (optional)
    await prisma.user.update({
        where: { id: user.id },
        data: { kycStatus: user.kycStatus }
    });

    console.log('\n--- Test Completed ---');
    await prisma.$disconnect();
}

testKycFix().catch(err => {
    console.error('Unexpected error during test:', err);
    process.exit(1);
});
