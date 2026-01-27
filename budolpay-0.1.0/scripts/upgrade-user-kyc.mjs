import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upgradeUser() {
    const phone = '09171854432';
    try {
        const user = await prisma.user.findFirst({
            where: { phoneNumber: phone }
        });

        if (!user) {
            console.log(`❌ User with phone ${phone} not found.`);
            return;
        }

        console.log(`Found user: ${user.fullName} (${user.id})`);
        console.log(`Current Tier: ${user.kycTier}`);

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                kycTier: 'FULLY_VERIFIED',
                kycStatus: 'VERIFIED',
                isFaceVerified: true
            }
        });

        console.log(`✅ User upgraded to: ${updated.kycTier}`);
    } catch (error) {
        console.error('❌ Error upgrading user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

upgradeUser();
