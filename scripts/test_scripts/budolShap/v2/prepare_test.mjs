import { PrismaClient } from '../../../../budolshap-0.1.0/node_modules/@prisma/client/index.js';
const prisma = new PrismaClient();

async function prepare() {
    try {
        await prisma.order.update({
            where: { id: 'cmkfmikm1000ygpt8lh4fpoel' },
            data: {
                status: 'PROCESSING',
                shipping: {
                    bookingId: 'TEST-LATENCY-SYNC-001',
                    provider: 'lalamove',
                    status: 'ASSIGNING_DRIVER'
                }
            }
        });
        console.log('Order prepared for test.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

prepare();
