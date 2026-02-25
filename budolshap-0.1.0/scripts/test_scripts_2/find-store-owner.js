/**
 * Find Store Owner
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

async function findStoreOwner() {
    const store = await prisma.store.findFirst({
        where: { name: 'e-Store' },
        include: { user: true }
    })

    if (store) {
        console.log('Store: e-Store')
        console.log('Owner Email:', store.user.email)
        console.log('Owner Name:', store.user.name)
    } else {
        console.log('Store "e-Store" not found')
    }

    await prisma.$disconnect()
}

findStoreOwner()
