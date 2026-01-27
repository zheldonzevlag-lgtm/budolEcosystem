const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'tony.stark@budolshap.com';
        const password = 'budolshap';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Creating user ${email} in budolID...`);
        
        const user = await prisma.user.upsert({
            where: { email },
            update: { 
                passwordHash: hashedPassword,
                phoneNumber: "+639484099302"
            },
            create: {
                email,
                passwordHash: hashedPassword,
                firstName: 'Tony',
                lastName: 'Stark',
                role: 'USER',
                isVerified: true,
                phoneNumber: "+639484099302"
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
