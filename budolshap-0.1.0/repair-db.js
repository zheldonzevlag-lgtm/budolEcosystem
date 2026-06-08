import { PrismaClient } from '@prisma/client';

async function main() {
    const dbUrl = process.env.DATABASE_URL || process.env.BUDOLSHAP_DATABASE_URL;
    if (!dbUrl) {
        console.error('FATAL: DATABASE_URL or BUDOLSHAP_DATABASE_URL environment variable is required');
        process.exit(1);
    }

    const prisma = new PrismaClient({
        datasources: {
            db: { url: dbUrl }
        }
    });

    try {
        console.log("Attempting database repair at 10.1.12.136...");
        
        const queries = [
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "emailProvider" TEXT DEFAULT 'GOOGLE'`,
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "smtpHost" TEXT DEFAULT 'smtp.gmail.com'`,
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "smtpPort" INTEGER DEFAULT 587`,
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "smtpUser" TEXT`,
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "smtpPass" TEXT`,
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "smtpFrom" TEXT`,
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "brevoApiKey" TEXT`,
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "gmassApiKey" TEXT`,
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "smsProvider" TEXT DEFAULT 'CONSOLE'`,
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "zerixApiKey" TEXT`,
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "itextmoApiKey" TEXT`,
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "itextmoClientCode" TEXT`,
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "viberApiKey" TEXT`,
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "brevoSmsApiKey" TEXT`,
            `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "marketingAdConfigs" JSONB DEFAULT '[]'`
        ];

        for (const sql of queries) {
            try {
                await prisma.$executeRawUnsafe(sql);
                console.log(`Success: ${sql.substring(0, 50)}...`);
            } catch (err) {
                if (err.message.includes("already exists")) {
                    console.log("Column already exists, skipped.");
                } else {
                    console.error("Query Error:", err.message);
                }
            }
        }

        console.log("Database repair complete.");
    } catch (error) {
        console.error("Initialization Error:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
