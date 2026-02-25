/**
 * Run migration on production database
 * This script adds the autoCompleteAt field if it doesn't exist
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Load production environment variables
const envPath = path.join(__dirname, '..', '.env.production')
const envContent = fs.readFileSync(envPath, 'utf-8')

// Parse DATABASE_URL from env file
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/)
if (!dbUrlMatch) {
    console.error('❌ DATABASE_URL not found in .env.production')
    process.exit(1)
}

const DATABASE_URL = dbUrlMatch[1].replace(/\n/g, '')

console.log('🔄 Connecting to production database...')

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL
        }
    }
})

async function runMigration() {
    try {
        console.log('\n📊 Checking if autoCompleteAt column exists...')

        // Check if column exists
        const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Order' 
      AND column_name = 'autoCompleteAt'
    `

        if (result.length > 0) {
            console.log('✅ Column autoCompleteAt already exists!')
            return
        }

        console.log('➕ Adding autoCompleteAt column...')

        // Add the column
        await prisma.$executeRaw`
      ALTER TABLE "Order" 
      ADD COLUMN "autoCompleteAt" TIMESTAMP(3)
    `

        console.log('✅ Migration completed successfully!')
        console.log('\n📝 Summary:')
        console.log('   - Added autoCompleteAt column to Order table')
        console.log('   - Type: TIMESTAMP(3) (nullable)')
        console.log('   - Purpose: Schedule automatic order completion 7 days after delivery')

    } catch (error) {
        console.error('❌ Migration failed:', error.message)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run the migration
runMigration()
    .then(() => {
        console.log('\n🎉 All done!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n💥 Fatal error:', error)
        process.exit(1)
    })
