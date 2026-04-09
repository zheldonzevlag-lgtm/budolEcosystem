// list_users.cjs
const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../../node_modules/@prisma/client'));

const DATABASE_URL = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require&schema=budolpay";

const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
});

async function main() {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });
    console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
