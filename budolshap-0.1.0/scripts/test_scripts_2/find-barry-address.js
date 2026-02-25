const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findBarryData() {
    const email = 'barry.allen@budolshap.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { Address: true }
    });

    if (!user) {
        console.log('User Barry not found');
        return;
    }

    console.log(`Barry ID: ${user.id}`);
    if (user.Address.length > 0) {
        console.log(`Address ID: ${user.Address[0].id}`);
    } else {
        console.log('No addresses found for Barry. Creating one...');
        const newAddr = await prisma.address.create({
            data: {
                userId: user.id,
                name: 'Barry Allen', // Name is required
                email: email, // Email is required
                street: 'Central City',
                city: 'Manila',
                state: 'Metro Manila',
                zip: '1000',
                phone: '09123456789',
                barangay: 'Barangay 1',
                country: 'Philippines'
            }
        });
        console.log(`Created Address ID: ${newAddr.id}`);
    }
}

findBarryData().finally(() => prisma.$disconnect());
