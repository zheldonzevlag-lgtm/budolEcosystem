const { PrismaClient } = require('@prisma/client');

// Alternative Production URL from list_users.cjs (Prisma IO)
const DATABASE_URL = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require&schema=budolpay";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL
        }
    }
});

async function checkCredentials() {
    const phone = '09484099388';
    const email = 'ivarhanestad@gmail.com';
    
    console.log(`Searching for: Phone=${phone}, Email=${email}`);
    
    try {
        const usersByPhone = await prisma.user.findMany({
            where: {
                OR: [
                    { phoneNumber: phone },
                    { phoneNumber: '+63' + phone.substring(1) },
                    { phoneNumber: phone.substring(1) }
                ]
            }
        });

        const usersByEmail = await prisma.user.findMany({
            where: { email: email }
        });

        console.log('--- RESULTS FROM budolpay SCHEMA ---');
        console.log('Users by Phone:', JSON.stringify(usersByPhone, null, 2));
        console.log('Users by Email:', JSON.stringify(usersByEmail, null, 2));

        if (usersByPhone.length === 0 && usersByEmail.length === 0) {
            console.log('No matches found in budolpay schema. Checking sample records...');
            const samples = await prisma.user.findMany({ take: 3 });
            console.log('Sample Users:', JSON.stringify(samples, null, 2));
        }

    } catch (err) {
        console.error('Error querying DB:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkCredentials();
