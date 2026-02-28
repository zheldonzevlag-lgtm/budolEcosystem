const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const phone = '09484099400';
    console.log(`\n📞 [budolPay] Checking phone: "${phone}"`);

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phoneNumber: phone },
                    { phoneNumber: phone.replace(/^0/, '63') },
                    { phoneNumber: phone.replace(/^0/, '+63') }
                ]
            }
        });

        if (user) {
            console.log('USER_FOUND in budolPay DATABASE: ' + JSON.stringify(user, null, 2));
        } else {
            console.log('USER_NOT_FOUND: ' + phone);
        }
    } catch (e) {
        console.error('ERROR: ' + e.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
