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

async function checkAllColumns() {
    const cols = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Order'
    ORDER BY ordinal_position
  `

    console.log('All columns in Order table:\n')
    cols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`))

    await prisma.$disconnect()
}

checkAllColumns().catch(console.error)
