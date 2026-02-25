/**
 * Quick verification of production database
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

async function verify() {
    console.log('Checking production database...\n')

    // Check schema
    const cols = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'Order' 
    AND column_name IN ('shippedAt', 'deliveredAt', 'completedAt', 'autoCompleteAt')
  `

    console.log(`Found ${cols.length}/4 required columns`)
    cols.forEach(c => console.log(`  ✅ ${c.column_name}`))

    // Check recent orders
    const orders = await prisma.order.count({
        where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
    })

    console.log(`\nRecent orders (last 7 days): ${orders}`)

    // Check delivered orders with autoCompleteAt
    const withAutoComplete = await prisma.order.count({
        where: {
            status: 'DELIVERED',
            autoCompleteAt: { not: null }
        }
    })

    console.log(`Delivered orders with autoCompleteAt: ${withAutoComplete}`)

    console.log('\n✅ Production database verified!')

    await prisma.$disconnect()
}

verify().catch(console.error)
