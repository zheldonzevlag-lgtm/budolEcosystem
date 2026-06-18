import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require"
        }
    }
})

async function main() {
    try {
        console.log("Checking production database schema and records...")
        
        // Check if we can connect
        console.log("\n1. Testing database connection...")
        const result = await prisma.$queryRaw`SELECT version()`
        console.log("✓ Connected to:", result[0].version)
        
        // Check all tables exist
        console.log("\n2. Checking if tables exist...")
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `
        console.log("Found", tables.length, "tables:")
        tables.forEach(t => console.log("  -", t.table_name))
        
        // Check SystemSettings specifically
        console.log("\n3. Checking SystemSettings table...")
        try {
            const systemSettings = await prisma.systemSettings.findMany()
            console.log("✓ SystemSettings records found:", systemSettings.length)
            if (systemSettings.length > 0) {
                console.log("Settings:", JSON.stringify(systemSettings[0], null, 2))
            }
        } catch (e) {
            console.log("⚠ SystemSettings table issue:", e.message)
        }
        
        // Check main tables
        console.log("\n4. Checking main tables...")
        const userCount = await prisma.user.count()
        const productCount = await prisma.product.count()
        const storeCount = await prisma.store.count()
        const orderCount = await prisma.order.count()
        
        console.log("  - Users:", userCount)
        console.log("  - Products:", productCount)
        console.log("  - Stores:", storeCount)
        console.log("  - Orders:", orderCount)
        
        // Check schema columns for a table
        console.log("\n5. Checking User table structure...")
        const userColumns = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'User'
            ORDER BY ordinal_position
        `
        console.log("User table columns:", userColumns.length)
        
    } catch (error) {
        console.error("Error checking database:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()