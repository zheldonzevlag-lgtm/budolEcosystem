
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function check() {
    try {
        const o = await prisma.order.findUnique({
            where: { id: 'cmj2rrllx0001f4e4oh9okn0n' }
        });
        console.log('Status:', o.status);
        console.log('Shipping:', JSON.stringify(o.shipping, null, 2));

        const logs = await prisma.webhookEvent.findMany({
            where: { orderId: 'cmj2rrllx0001f4e4oh9okn0n' }
        });
        console.log('Webhook Logs:', logs.length);
        if (logs.length > 0) console.log(logs[0]);
    } catch (e) { console.error(e); }
    finally { await prisma.$disconnect(); }
}
check();
