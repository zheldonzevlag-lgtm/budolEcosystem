const { PrismaClient } = require('D:/IT Projects/budolEcosystem/budolshap-0.1.0/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function updateSocketUrl() {
    try {
        console.log('[update-socket-url] Models available:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));

        console.log('[update-socket-url] Checking current SystemSettings...');
        // Try to access it. If SystemSettings in schema, it should be systemSettings in client.
        const current = await prisma.systemSettings.findFirst();
        console.log('[update-socket-url] Current socketUrl:', current?.socketUrl || 'Not set');

        const updated = await prisma.systemSettings.updateMany({
            data: {
                socketUrl: 'https://budolws.duckdns.org',
                realtimeProvider: 'SOCKET_IO',
            }
        });

        console.log('[update-socket-url] Updated', updated.count, 'record(s)');

        const verify = await prisma.systemSettings.findFirst();
        console.log('[update-socket-url] ✅ Verified new socketUrl:', verify?.socketUrl);
    } catch (err) {
        console.error('[update-socket-url] ❌ Error:', err.message);
        if (err.message.includes('systemSettings')) {
            console.log('[update-socket-url] Hint: Prisma models are case-sensitive and camelCased.');
        }
    } finally {
        await prisma.$disconnect();
    }
}

updateSocketUrl();
