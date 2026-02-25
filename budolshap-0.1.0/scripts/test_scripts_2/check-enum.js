/**
 * Check OrderStatus Enum in Production
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

async function checkEnum() {
    console.log('Checking OrderStatus enum values...\n')

    try {
        // We can't query enum directly easily with Prisma Client, 
        // but we can try to update an order with a dummy status to see the error message
        // which lists allowed values, or query pg_enum

        const enums = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"OrderStatus"))::text as status
    `

        console.log('Allowed OrderStatus values:')
        enums.forEach(e => console.log(`  - ${e.status}`))

    } catch (error) {
        console.error('Error checking enum:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

checkEnum()
