const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function softDeleteSteve() {
    const userId = 'e8a42664-8bd2-4d45-b5e9-a04c30cb4686'; // Steve Rogers ID
    console.log(`Attempting to soft delete user ${userId}...`);

    try {
        await prisma.$transaction(async (tx) => {
            console.log(`[Script] Starting transaction...`);

            // 1. Update user
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { deletedAt: new Date() }
            });
            console.log(`[Script] Updated user. deletedAt:`, updatedUser.deletedAt);

            // 2. Update external schemas
            try {
                await tx.$executeRawUnsafe(`UPDATE "budolid"."User" SET "deletedAt" = NOW() WHERE id = $1`, userId);
                console.log(`[Script] Updated budolid schema.`);
            } catch (e) {
                console.warn(`[Script] Failed budolid update:`, e.message);
            }

            try {
                await tx.$executeRawUnsafe(`UPDATE "budolpay"."User" SET "deletedAt" = NOW() WHERE id = $1`, userId);
                console.log(`[Script] Updated budolpay schema.`);
            } catch (e) {
                console.warn(`[Script] Failed budolpay update:`, e.message);
            }
        });
        console.log('Transaction committed successfully.');
    } catch (e) {
        console.error('Transaction failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

softDeleteSteve();
