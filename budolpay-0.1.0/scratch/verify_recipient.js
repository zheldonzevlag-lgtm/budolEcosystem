const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const target = '+639484099400';
    const variant = '09484099400';
    
    console.log(`--- Searching for Recipient: ${target} ---`);
    try {
        const exactMatch = await prisma.user.findUnique({
            where: { phoneNumber: target }
        });
        
        const variantMatch = await prisma.user.findUnique({
            where: { phoneNumber: variant }
        });

        console.log('Exact Match (+63...):', exactMatch ? `Found (ID: ${exactMatch.id}, Email: ${exactMatch.email})` : 'NOT FOUND');
        console.log('Variant Match (09...):', variantMatch ? `Found (ID: ${variantMatch.id}, Email: ${variantMatch.email})` : 'NOT FOUND');
        
    } catch (err) {
        console.error('Lookup failed:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
