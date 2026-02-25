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
    const orderId = 'cmiq1h2j80006l204batceqe1';
    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    console.log('Driver details:', JSON.stringify(order.shipping?.driver, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
