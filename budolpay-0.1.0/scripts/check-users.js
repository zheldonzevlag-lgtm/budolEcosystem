const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true }
        });
        console.log('--- LOCAL USERS ---');
        console.log(JSON.stringify(users, null, 2));

        const adminIdFromLog = '28c8cce9-a7f8-4526-b18e-c39390fa80b1';
        const found = users.find(u => u.id === adminIdFromLog);
        console.log(`\nSearching for Admin ID ${adminIdFromLog}...`);
        if (found) {
            console.log('FOUND:', found);
        } else {
            console.log('NOT FOUND in local database.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
