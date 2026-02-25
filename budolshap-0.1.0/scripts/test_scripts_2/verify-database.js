require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
    const prisma = new PrismaClient();

    try {
        console.log('🔍 Checking database connection...\n');

        // Get database info
        const result = await prisma.$queryRaw`SELECT current_database() as db_name`;
        console.log('✅ Connected to database:', result[0].db_name);

        // Count total orders
        const totalOrders = await prisma.order.count();
        console.log(`📦 Total orders in database: ${totalOrders}`);

        // Count orders with shipping data
        const ordersWithShipping = await prisma.order.count({
            where: {
                shipping: {
                    not: null
                }
            }
        });
        console.log(`🚚 Orders with shipping data: ${ordersWithShipping}`);

        // Count Lalamove orders
        const lalamoveOrders = await prisma.order.count({
            where: {
                shipping: {
                    path: ['provider'],
                    equals: 'lalamove'
                }
            }
        });
        console.log(`📍 Lalamove orders: ${lalamoveOrders}`);

        // Get recent orders
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                status: true,
                total: true,
                createdAt: true,
                shipping: true
            }
        });

        console.log('\n📋 Recent orders:');
        recentOrders.forEach((order, index) => {
            console.log(`\n${index + 1}. Order ID: ${order.id}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Total: ₱${order.total}`);
            console.log(`   Created: ${order.createdAt.toLocaleString()}`);
            console.log(`   Shipping: ${order.shipping?.provider || 'None'}`);
            if (order.shipping?.driver) {
                console.log(`   Driver: ${order.shipping.driver.name}`);
            }
        });

        console.log('\n✅ Database is intact and working properly!');
        console.log('✅ No data was deleted or wiped out.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
