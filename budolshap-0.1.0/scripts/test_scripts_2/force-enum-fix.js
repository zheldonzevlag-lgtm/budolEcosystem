
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load .env.local manually to ensure we get PROD url
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);

if (!dbUrlMatch) {
    console.error('Could not find DATABASE_URL in .env.local');
    process.exit(1);
}

process.env.DATABASE_URL = dbUrlMatch[1];
console.log('Target DB:', process.env.DATABASE_URL.substring(0, 20) + '...');

const prisma = new PrismaClient();

async function run() {
    try {
        console.log('Running ALTER TYPE...');
        await prisma.$executeRawUnsafe(`ALTER TYPE "OrderStatus" ADD VALUE 'IN_TRANSIT';`);
        console.log("✅ Enum updated successfully!");
    } catch (e) {
        if (e.message.includes("already exists")) {
            console.log("⚠️ Enum value already exists (Safe to ignore)");
        } else {
            console.error("❌ Failed:", e);
        }
    } finally {
        await prisma.$disconnect();
    }
}

run();
