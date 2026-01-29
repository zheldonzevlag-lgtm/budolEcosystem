const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../../budolID-0.1.0/generated/client'));
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seedUser() {
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.upsert({
            where: { email: 'admin@budol.com' },
            update: { password: hashedPassword },
            create: {
                email: 'admin@budol.com',
                password: hashedPassword,
                firstName: 'Budol',
                lastName: 'Admin',
                role: 'ADMIN'
            }
        });
        console.log('✅ Test user seeded in budolID:', user.email);
    } catch (error) {
        console.error('❌ Error seeding user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedUser();