const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const password = 'asakapa';
    const hashedPassword = await bcrypt.hash(password, 10);

    const users = [
        {
            id: '8b23b71b-c27e-4964-a15a-ead0b563ea8d',
            email: 'reynaldomgalvez@gmail.com',
            password: hashedPassword,
            name: 'Reynaldo Galvez',
            phoneNumber: '09123456780',
            image: 'https://ui-avatars.com/api/?name=Reynaldo+Galvez',
            accountType: 'ADMIN',
            role: 'ADMIN',
            isAdmin: true
        },
        {
            id: 'clark-kent-id-001',
            email: 'clark.kent@budolshap.com',
            password: hashedPassword,
            name: 'Clark Kent',
            phoneNumber: '09123456789',
            image: 'https://ui-avatars.com/api/?name=Clark+Kent',
            accountType: 'BUYER',
            role: 'USER',
            isAdmin: false
        }
    ];

    console.log('--- Seeding Users ---');
    for (const u of users) {
        try {
            const user = await prisma.user.upsert({
                where: { email: u.email },
                update: u,
                create: u
            });
            console.log(`User created/updated: ${user.email} (${user.id})`);
        } catch (error) {
            console.error(`Error seeding user ${u.email}:`, error);
        }
    }
    console.log('--- Done ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
