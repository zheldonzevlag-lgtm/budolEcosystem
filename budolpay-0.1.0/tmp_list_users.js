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

async function listAllUsers() {
    console.log('Listing all users in budolpay schema...');
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                phoneNumber: true,
                firstName: true,
                lastName: true
            }
        });

        console.log(`Found ${users.length} users:`);
        console.log(JSON.stringify(users, null, 2));

    } catch (err) {
        console.error('Error querying DB:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

listAllUsers();
