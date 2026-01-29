require('dotenv').config();
const { PrismaClient } = require('./generated/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function main() {
    try {
        const email = 'tony@budol.id';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Creating user ${email} in budolID...`);

        const user = await prisma.user.upsert({
            where: { email },
            update: { password: hashedPassword },
            create: {
                email,
                password: hashedPassword,
                firstName: 'Tony',
                lastName: 'Budol',
                role: 'USER',
                isVerified: true
            }
        });

        console.log('✅ User created/updated in budolID:', user.email);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
