require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyRatings() {
    try {
        console.log('🔍 Finding a user with orders...');
        const order = await prisma.order.findFirst({
            where: {
                orderItems: {
                    some: {}
                }
            },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                rating: {
                                    // This is the structure we added to the API
                                    select: {
                                        id: true,
                                        rating: true,
                                        review: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            console.log('❌ No orders found in database.');
            return;
        }

        console.log('✅ Found order:', order.id);
        console.log('📦 Order Items:');

        order.orderItems.forEach(item => {
            console.log(`   - Product: ${item.product.name}`);
            console.log(`     Ratings Count: ${item.product.rating.length}`);
            if (item.product.rating.length > 0) {
                console.log(`     ⭐ First Rating: ${item.product.rating[0].rating} stars`);
            } else {
                console.log(`     ⚪ No ratings found for this user/product combination.`);
            }
        });

        console.log('\n✅ API Structure Verification Passed: The Prisma query can successfully fetch ratings nested within products.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyRatings();
