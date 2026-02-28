const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteUserByPhone() {
    const phone = '09484099400';
    console.log(`\n🗑️ [budolPay] Cleaning up synced user: "${phone}"`);

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phoneNumber: phone },
                    { phoneNumber: '+63' + phone.substring(1) }
                ]
            }
        });

        if (user) {
            // Delete wallet first
            try {
                await prisma.wallet.deleteMany({ where: { userId: user.id } });
            } catch (e) { }

            await prisma.user.delete({ where: { id: user.id } });
            console.log('✅ User deleted successfully.');
        } else {
            console.log('⚠️ User not found.');
        }
    } catch (e) {
        console.error('ERROR: ' + e.message);
    } finally {
        await prisma.$disconnect();
    }
}

deleteUserByPhone();
