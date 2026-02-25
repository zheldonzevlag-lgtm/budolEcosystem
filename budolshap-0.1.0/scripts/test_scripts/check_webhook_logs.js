const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const recentLogs = await prisma.webhookEvent.findMany({
        where: { provider: 'lalamove' },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    if (recentLogs.length === 0) {
        console.log('No recent Lalamove webhook logs found in the database.');
        return;
    }
    console.log(`Found ${recentLogs.length} recent Lalamove Webhook Logs:`);
    recentLogs.forEach(log => {
        console.log(`[${log.createdAt.toISOString()}] Event: ${log.eventType}, Status: ${log.status}, OrderId: ${log.orderId || 'N/A'}`);
        if (log.error) console.log(`  Error: ${log.error}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
