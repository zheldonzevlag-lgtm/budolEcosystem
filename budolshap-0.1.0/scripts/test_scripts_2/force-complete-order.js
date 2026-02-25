const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load production environment variables
const envPath = path.join(__dirname, '..', '.env.production');
const envContent = fs.readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
const DATABASE_URL = dbUrlMatch[1].replace(/\n/g, '');

const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
});

async function main() {
    const orderId = 'cmirjyrtl0002jl04lzlwbl0b';

    console.log('🔄 Manually completing order:', orderId);

    const autoCompleteDate = new Date();
    autoCompleteDate.setDate(autoCompleteDate.getDate() + 3); // Auto-complete in 3 days

    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
            autoCompleteAt: autoCompleteDate,
            shipping: {
                update: {
                    status: 'COMPLETED'
                }
            }
        }
    });

    console.log('\n✅ Order updated successfully!');
    console.log('Status:', updatedOrder.status);
    console.log('Delivered At:', updatedOrder.deliveredAt);
    console.log('Auto Complete At:', updatedOrder.autoCompleteAt);
    console.log('\n📄 Check the order page now: https://budolshap.vercel.app/orders/' + orderId);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
