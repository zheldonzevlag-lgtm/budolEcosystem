const { PrismaClient } = require('./generated/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:r00t@localhost:5432/budolid?schema=public"
        }
    }
});

async function main() {
    try {
        const email = 'tony.stark@budolshap.com';
        const password = 'budolshap';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Creating user ${email} in budolID...`);

        const user = await prisma.user.upsert({
            where: { email },
            update: { password: hashedPassword },
            create: {
                email,
                password: hashedPassword,
                firstName: 'Tony',
                lastName: 'Stark',
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
