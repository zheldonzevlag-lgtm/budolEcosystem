const { prisma } = require('@budolpay/database');

async function getUser() {
    try {
        const user = await prisma.user.findFirst({
            select: { id: true, email: true }
        });
        console.log(JSON.stringify(user));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

getUser();
