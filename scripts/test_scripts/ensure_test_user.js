const { PrismaClient } = require('../../budolID-0.1.0/generated/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'reynaldomgalvez@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
        await prisma.user.create({
            data: {
                email,
                name: 'Reynaldo Galvez',
                password: 'TemporaryPassword123!',
                phoneNumber: '+639123456789'
            }
        });
        console.log('USER_CREATED');
    } else {
        console.log('USER_EXISTS');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
