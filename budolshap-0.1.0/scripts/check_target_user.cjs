const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const phone = '09484099400';
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
            console.log('USER_FOUND: ' + JSON.stringify(user, null, 2));
        } else {
            console.log('USER_NOT_FOUND: ' + phone);
            // Let's list a few users to see the phone format
            const someUsers = await prisma.user.findMany({
                take: 5,
                where: {
                    phoneNumber: { not: null }
                },
                select: {
                    id: true,
                    email: true,
                    phoneNumber: true
                }
            });
            console.log('PHONE_FORMAT_SAMPLES: ' + JSON.stringify(someUsers, null, 2));
        }
    } catch (e) {
        console.error('ERROR: ' + e.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
