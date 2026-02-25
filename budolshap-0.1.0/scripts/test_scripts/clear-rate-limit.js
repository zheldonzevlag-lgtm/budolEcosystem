import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clearRateLimit() {
    try {
        const result = await prisma.rateLimit.deleteMany({
            where: {
                key: {
                    contains: 'diana.prince@budolshap.com'
                }
            }
        });
        console.log(`Cleared ${result.count} rate limit records.`);
    } catch (error) {
        console.error('Error clearing rate limit:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearRateLimit();
