const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHeartbeat() {
    try {
        const heartbeat = await prisma.systemSetting.findUnique({
            where: { key: 'DRS_ENGINE_HEARTBEAT' }
        });
        console.log('Current DRS_ENGINE_HEARTBEAT:', heartbeat);
        
        const now = new Date();
        if (heartbeat) {
            const lastHeartbeat = new Date(heartbeat.value);
            const diffMs = now - lastHeartbeat;
            console.log(`Time since last heartbeat: ${diffMs / 1000} seconds`);
        } else {
            console.log('No heartbeat entry found in database.');
        }
    } catch (error) {
        console.error('Error checking heartbeat:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkHeartbeat();
