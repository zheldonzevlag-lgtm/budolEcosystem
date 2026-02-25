const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgres://63eff3860e4713f2156a5a6fad51bf84aa23f0018561ee0aa98bc1d2465ba02f:sk_1K0T2X4hoL6Z0F6NsgLdn@db.prisma.io:5432/postgres?sslmode=require"
        }
    }
});

async function main() {
    try {
        console.log('Connecting to production database...');

        // Add missing columns to Address table
        const queries = [
            `ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "houseNumber" TEXT`,
            `ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "subdivision" TEXT`,
            `ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "landmark" TEXT`,
            `ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION`,
            `ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION`,
            `ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "buildingName" TEXT`,
            `ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "floorUnit" TEXT`,
            `ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "notes" TEXT`,
            `ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
            `ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
            `ALTER TABLE "Address" ALTER COLUMN "country" SET DEFAULT 'Philippines'`
        ];

        for (const query of queries) {
            console.log(`Executing: ${query}`);
            await prisma.$executeRawUnsafe(query);
        }

        // Handle barangay column separately - make it nullable if it exists with null values
        console.log('Handling barangay column...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "barangay" TEXT`);

        // Update any null barangay values to a default
        console.log('Updating null barangay values...');
        await prisma.$executeRawUnsafe(`UPDATE "Address" SET "barangay" = city WHERE "barangay" IS NULL`);

        console.log('✅ Production database schema updated successfully!');

        // Verify the changes
        const count = await prisma.address.count();
        console.log(`Total addresses in database: ${count}`);

    } catch (error) {
        console.error('❌ Error updating schema:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
