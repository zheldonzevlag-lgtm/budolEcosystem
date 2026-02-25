
import { prisma } from '../../lib/prisma.js';

async function testApi() {
    try {
        console.log('Testing Audit Logs API (Prisma Query)...');
        
        console.log('Running Prisma Query...');
        const logs = await prisma.auditLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        image: true,
                        role: true
                    }
                }
            }
        });

        console.log(`Found ${logs.length} logs.`);
        if (logs.length > 0) {
            console.log('Sample Log:', JSON.stringify(logs[0], null, 2));
            if (logs[0].user) {
                console.log('User data found:', logs[0].user);
            } else {
                console.log('User data is NULL (System action?)');
            }
        } else {
            console.log('No logs found! This explains why the list is empty.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testApi();
