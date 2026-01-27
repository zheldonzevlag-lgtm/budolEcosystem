const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    try {
        const typoEmail = 'tony.stark@budolashap.com';
        const correctEmail = 'tony.stark@budolshap.com';
        const password = 'budolshap';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Creating typo-resilient user ${typoEmail} in budolID...`);
        
        // We create a second account for the typo email so the user can login even with the typo
        const user = await prisma.user.upsert({
            where: { email: typoEmail },
            update: { 
                passwordHash: hashedPassword,
                phoneNumber: "+639484099302-typo" // Slightly different phone to avoid unique constraint if needed, or use same if allowed
            },
            create: {
                email: typoEmail,
                passwordHash: hashedPassword,
                firstName: 'Tony (Typo-Resilient)',
                lastName: 'Stark',
                role: 'USER',
                isVerified: true,
                phoneNumber: "+639484099302-typo"
            }
        });

        console.log('✅ Typo-resilient user created/updated in budolID:', user.email);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
