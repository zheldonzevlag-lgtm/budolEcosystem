/**
 * Add missing timestamp fields to Order table
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

async function addMissingFields() {
    console.log('🔄 Adding missing timestamp fields to Order table...\n')

    const fieldsToAdd = [
        { name: 'shippedAt', description: 'When package was picked up by driver' },
        { name: 'deliveredAt', description: 'When package was delivered to customer' },
        { name: 'completedAt', description: 'When order was marked as completed' }
    ]

    for (const field of fieldsToAdd) {
        try {
            // Check if field exists
            const exists = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = ${field.name}
      `

            if (exists.length > 0) {
                console.log(`✅ ${field.name} already exists`)
                continue
            }

            // Add the field
            console.log(`➕ Adding ${field.name}...`)
            await prisma.$executeRawUnsafe(`
        ALTER TABLE "Order" 
        ADD COLUMN "${field.name}" TIMESTAMP(3)
      `)
            console.log(`   ✅ Added ${field.name} - ${field.description}`)

        } catch (error) {
            console.error(`❌ Error adding ${field.name}:`, error.message)
        }
    }

    console.log('\n✅ Migration complete!')

    // Verify
    const allFields = await prisma.$queryRaw`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'Order' 
    AND column_name IN ('paidAt', 'shippedAt', 'deliveredAt', 'completedAt', 'autoCompleteAt')
    ORDER BY column_name
  `

    console.log('\n📊 Timestamp fields in Order table:')
    allFields.forEach(f => console.log(`   ✅ ${f.column_name}`))

    await prisma.$disconnect()
}

addMissingFields().catch(console.error)
