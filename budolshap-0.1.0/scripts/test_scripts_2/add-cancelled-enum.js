/**
 * Add CANCELLED to OrderStatus Enum
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.production')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/)
const DATABASE_URL = dbUrlMatch[1].replace(/\n/g, '')

const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
})

async function updateEnum() {
    console.log('🔄 Adding CANCELLED to OrderStatus enum...\n')

    try {
        // Add value to enum
        await prisma.$executeRawUnsafe(`
      ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';
    `)

        console.log('✅ Successfully added CANCELLED to OrderStatus enum')

    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('✅ CANCELLED already exists in OrderStatus enum')
        } else {
            console.error('❌ Error updating enum:', error.message)
        }
    } finally {
        await prisma.$disconnect()
    }
}

updateEnum()
