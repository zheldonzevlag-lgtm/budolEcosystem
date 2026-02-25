require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

process.env.DATABASE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhY2NlbGVyYXRlX3VybCI6Imh0dHBzOi8vYWNjZWxlcmF0ZS5wcmlzbWEtZGF0YS5uZXQiLCJhcGlfa2V5IjoiY2FjaGVfcHJveHlfY29ubmVjdGlvbl9wb29sX2NsYWl0X2NsaWVudF9pZF9jb25uZWN0aW9uX3N0cmluZyJ9";

const prisma = new PrismaClient();

async function checkOrder() {
    const orderId = 'cmisl1hbs0003js04ncr6j24x';

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        console.log('Order not found!');
        return;
    }

    console.log('\n=== Order Shipping Data ===');
    console.log(JSON.stringify(order.shipping, null, 2));

    await prisma.$disconnect();
}

checkOrder();
