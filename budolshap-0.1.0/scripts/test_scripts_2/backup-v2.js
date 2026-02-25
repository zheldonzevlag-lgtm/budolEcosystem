require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function backup() {
    console.log('Starting backup v2...')
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19) // Safer timestamp
    const backupDir = path.join(__dirname, '../backups')

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
    }

    const backupFile = path.join(backupDir, `backup-${timestamp}.json`)

    console.log('Fetching data...')
    const data = {
        timestamp: now.toISOString(),
        users: await prisma.user.findMany(),
        stores: await prisma.store.findMany(),
        products: await prisma.product.findMany(),
        orders: await prisma.order.findMany({ include: { orderItems: true } }),
        wallets: await prisma.wallet.findMany({ include: { transactions: true } }),
        payoutRequests: await prisma.payoutRequest.findMany(),
        addresses: await prisma.address.findMany(),
        coupons: await prisma.coupon.findMany()
    }

    console.log(`Writing ${Object.keys(data).length - 1} tables to file...`)
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2))
    console.log('✅ Backup saved to', backupFile)
}

backup()
    .catch(e => {
        console.error('❌ Backup Failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
