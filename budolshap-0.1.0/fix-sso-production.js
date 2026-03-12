
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Updating EcosystemApp records for production...");
        
        // Update budolshap
        await prisma.$executeRawUnsafe(`
            UPDATE "EcosystemApp" 
            SET "redirectUri" = 'https://budolshap.duckdns.org/auth/callback' 
            WHERE "apiKey" = 'bs_key_2025'
        `);
        
        // Update budolpay
        await prisma.$executeRawUnsafe(`
            UPDATE "EcosystemApp" 
            SET "redirectUri" = 'https://budolpay.duckdns.org/auth/callback' 
            WHERE "apiKey" = 'bp_key_2025'
        `);
        
        console.log("SUCCESS: redirectUri updated to duckdns.org for bp and bs keys.");
    } catch (e) {
        console.error("DB Update failed (might be missing table yet):", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
