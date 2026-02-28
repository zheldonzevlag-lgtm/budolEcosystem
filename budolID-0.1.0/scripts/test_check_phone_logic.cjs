const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();
const { normalizePhilippinePhone } = require('../utils/phoneNormalization');

async function testCheckPhone() {
    const phone = '09484099400';
    console.log(`\n📞 [Test] Check Phone Request: "${phone}"`);

    try {
        const normalizedPhone = normalizePhilippinePhone(phone);
        console.log(`🔍 [Test] Normalized to: "${normalizedPhone}"`);

        if (!normalizedPhone) {
            console.log(`❌ [Test] Normalization failed`);
            return;
        }

        const schemas = ['budolid', 'public'];
        let user = null;
        let foundSchema = null;

        for (const schema of schemas) {
            console.log(`📡 [Test] Checking schema "${schema}" for "${normalizedPhone}"`);
            try {
                const results = await prisma.$queryRawUnsafe(
                    `SELECT id, "phoneNumber", "firstName", "lastName", email FROM "${schema}"."User" WHERE "phoneNumber" = $1 LIMIT 1`,
                    normalizedPhone
                );

                if (results && results.length > 0) {
                    user = results[0];
                    foundSchema = schema;
                    console.log(`✅ [Test] Found in "${schema}":`, user);
                    break;
                }
            } catch (e) {
                console.error(`❌ [Test] Error in schema "${schema}": ${e.message}`);
            }
        }

        if (!user) {
            console.log(`⚠️ [Test] NOT FOUND`);
        }
    } catch (error) {
        console.error(`❌ [Test] Fatal Error:`, error);
    } finally {
        await prisma.$disconnect();
    }
}

testCheckPhone();
