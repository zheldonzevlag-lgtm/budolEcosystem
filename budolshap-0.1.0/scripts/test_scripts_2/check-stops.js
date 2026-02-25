const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orderId = 'cmikk91l7000411sr5967dqui';

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (order && order.shipping) {
        console.log('Shipping Data:');
        console.log(JSON.stringify(order.shipping, null, 2));

        if (order.shipping.stops) {
            console.log('\nStops Structure:');
            order.shipping.stops.forEach((stop, i) => {
                console.log(`\nStop ${i}:`, {
                    hasStopId: !!stop.stopId,
                    stopId: stop.stopId,
                    hasCoordinates: !!stop.coordinates,
                    coordinates: stop.coordinates
                });
            });
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
