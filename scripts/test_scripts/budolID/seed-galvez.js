console.log('Starting seed-galvez.js...');
require('dotenv').config();
console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
const { prisma } = require('@budolpay/database');
const bcrypt = require('bcryptjs');

async function main() {
    const email = 'reynaldomgalvez@gmail.com';
    const password = 'tr@1t0r'; // Default test password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: { 
            passwordHash: hashedPassword,
            firstName: 'Reynaldo',
            lastName: 'Galvez',
            role: 'ADMIN',
            phoneNumber: '09123456780'
        },
        create: {
            email,
            passwordHash: hashedPassword,
            firstName: 'Reynaldo',
            lastName: 'Galvez',
            role: 'ADMIN',
            phoneNumber: '09123456780'
        }
    });

    console.log('User synced:', user.email, user.id);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
