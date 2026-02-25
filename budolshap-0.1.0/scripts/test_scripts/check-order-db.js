const { PrismaClient } = require('@prisma/client-custom-v4');

// Hardcoded for debugging since .env is corrupted
process.env.DATABASE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhY2NlbGVyYXRlX3VybCI6Imh0dHBzOi8vYWNjZWxlcmF0ZS5wcmlzbWEtZGF0YS5uZXQiLCJhcGlfa2V5IjoiY2FjaGVfcHJveHlfY29ubmVjdGlvbl9wb29sX2NsYWl0X2NsaWVudF9pZF9jb25uZWN0aW9uX3N0cmluZyJ9"; // Placeholder, I can't see the full key. 

// Actually, I should try to fix the .env file.
const prisma = new PrismaClient();

async function main() {
    console.log("Starting query...");
    try {
        const order = await prisma.order.findUnique({
            where: { id: 'cmirxjgt50002jp04l6w88rld' }
        });
        console.log("Order found:");
        console.log(JSON.stringify(order, null, 2));
    } catch (error) {
        console.error("Error querying order:", error);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
