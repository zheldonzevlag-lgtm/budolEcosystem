const { prisma } = require('@budolpay/database');

async function main() {
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL || 'Default (from Prisma schema/env)');
    const users = await prisma.user.findMany();
    console.log('Users in DB:', users.map(u => ({ email: u.email, id: u.id })));
}

main().finally(() => prisma.$disconnect());
