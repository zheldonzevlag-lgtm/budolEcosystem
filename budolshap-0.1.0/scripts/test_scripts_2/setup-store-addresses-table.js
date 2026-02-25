/**
 * Database Setup Script for Vercel Production
 * 
 * This script creates the StoreAddress table directly using Prisma Client
 * Run this AFTER deploying to Vercel
 * 
 * Usage: 
 * 1. Deploy to Vercel first
 * 2. Run: node scripts/setup-store-addresses-table.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createStoreAddressTable() {
    console.log('🚀 Setting up StoreAddress table...\n')

    try {
        // Try to create the table using raw SQL
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "StoreAddress" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "storeId" TEXT NOT NULL,
                "phone" TEXT NOT NULL,
                "district" TEXT NOT NULL,
                "province" TEXT,
                "city" TEXT NOT NULL,
                "barangay" TEXT NOT NULL,
                "detailedAddress" TEXT NOT NULL,
                "zip" TEXT NOT NULL,
                "country" TEXT NOT NULL DEFAULT 'Philippines',
                "notes" TEXT,
                "latitude" DOUBLE PRECISION,
                "longitude" DOUBLE PRECISION,
                "isDefault" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT "StoreAddress_storeId_fkey" FOREIGN KEY ("storeId") 
                    REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE
            );
        `)
        console.log('✅ StoreAddress table created successfully!\n')

        // Create index
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "StoreAddress_storeId_idx" ON "StoreAddress"("storeId");
        `)
        console.log('✅ Index created successfully!\n')

        // Verify table exists
        const count = await prisma.storeAddress.count()
        console.log(`✅ Verification: StoreAddress table has ${count} records\n`)

        console.log('✨ Setup completed successfully!\n')
        console.log('Next steps:')
        console.log('1. Run: node scripts/migrate-store-addresses.js')
        console.log('2. Test the feature at /store/settings\n')

    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️  StoreAddress table already exists!')
            const count = await prisma.storeAddress.count()
            console.log(`   Current records: ${count}\n`)
        } else {
            console.error('❌ Error:', error.message)
            throw error
        }
    } finally {
        await prisma.$disconnect()
    }
}

createStoreAddressTable()
    .catch((error) => {
        console.error('Fatal error:', error)
        process.exit(1)
    })
