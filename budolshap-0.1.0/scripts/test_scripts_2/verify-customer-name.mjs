
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCustomerName() {
    try {
        console.log('🔍 Verifying customer names in orders...');
        
        const orders = await prisma.order.findMany({
            include: {
                user: true,
                address: true
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        if (orders.length === 0) {
            console.log('❌ No orders found.');
            return;
        }

        console.log(`\nFound ${orders.length} recent orders:`);
        orders.forEach((order, index) => {
            console.log(`\nOrder #${index + 1}:`);
            console.log(`  ID: ${order.id}`);
            console.log(`  User Name (from User table): ${order.user.name}`);
            console.log(`  Customer Name (from Address table): ${order.address.name}`);
            console.log(`  Address: ${order.address.street}, ${order.address.city}`);
            
            if (order.address.name === 'Natasha Romanoff') {
                console.log('  ✅ MATCH: Customer name is Natasha Romanoff');
            } else if (order.address.name === 'Jon Galvez') {
                console.log('  ⚠️ WARNING: Customer name is Jon Galvez');
            }
        });

        const natashaOrder = orders.find(o => o.address.name === 'Natasha Romanoff');
        if (natashaOrder) {
            console.log('\n✨ SUCCESS: Natasha Romanoff is correctly associated with orders.');
        } else {
            console.log('\n❌ FAILURE: Natasha Romanoff not found in recent orders.');
        }

    } catch (error) {
        console.error('💥 Verification Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyCustomerName();
