const { PrismaClient } = require('@budolpay/database');
const prisma = new PrismaClient();

async function checkUsers() {
    console.log('Connecting to budolPay database...');
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, firstName: true, lastName: true }
        });
        console.log(`Found ${users.length} users:`);
        users.forEach(u => console.log(`User: ${u.firstName} ${u.lastName} (${u.email}) - ID: ${u.id}`));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
