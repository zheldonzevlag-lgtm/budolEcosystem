
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWebhookLogs() {
    try {
        console.log('Fetching last 10 webhook events...');
        const logs = await prisma.webhookEvent.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        console.log('Found logs:', logs.length);

        for (const log of logs) {
            console.log('------------------------------------------------');
            console.log(`ID: ${log.id}`);
            console.log(`Time: ${log.createdAt}`);
            console.log(`Status: ${log.status}`);
            console.log(`Event Type: ${log.eventType}`);
            console.log(`Error: ${log.error || 'None'}`);
            console.log('Payload Snippet:', JSON.stringify(log.payload).substring(0, 500));
            // Check specifically for order status in payload
            const payload = log.payload;
            if (payload && (payload.status || payload.data?.order?.status)) {
                console.log(`PAYLOAD STATUS: ${payload.status || payload.data?.order?.status}`);
            }
        }
    } catch (error) {
        console.error('Error fetching logs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkWebhookLogs();
