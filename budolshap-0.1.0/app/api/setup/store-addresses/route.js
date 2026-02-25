import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Setup API Endpoint
 * Creates the StoreAddress table if it doesn't exist
 * 
 * Visit: /api/setup/store-addresses
 */
export async function GET(_request) {
    try {
        console.log('Setting up StoreAddress table...')

        // 1. List existing tables to debug
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `
        console.log('Existing tables:', tables)

        // 2. Try to create the table
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "StoreAddress" (
                "id" TEXT NOT NULL,
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
                
                CONSTRAINT "StoreAddress_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "StoreAddress_storeId_fkey" FOREIGN KEY ("storeId") 
                    REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE
            );
        `)

        // 3. Create index
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "StoreAddress_storeId_idx" ON "StoreAddress"("storeId");
        `)

        // 4. Verify again
        const count = await prisma.storeAddress.count()

        const finalTables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `

        return NextResponse.json({
            success: true,
            message: 'Setup completed',
            initialTables: tables,
            finalTables: finalTables,
            recordCount: count
        })

    } catch (error) {
        console.error('Setup error:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
