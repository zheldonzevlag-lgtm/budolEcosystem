import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
    try {
        const users = await prisma.user.findMany({
            take: 10
        });

        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- ${u.fullName} (${u.email || 'no email'}) | ID: ${u.id} | Tier: ${u.kycTier}`);
        });
    } catch (error) {
        console.error('❌ Error listing users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
