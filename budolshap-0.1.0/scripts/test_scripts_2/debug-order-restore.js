
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
    console.log('🐞 Debugging Order Restoration...')

    // Find latest backup
    // Hardcode known working backup for debug
    const backupsDir = path.join(__dirname, '../backups')
    const backupFolder = '2025-12-13_12-19'
    console.log(`📂 Using backup: ${backupFolder}`)

    const ordersPath = path.join(backupsDir, backupFolder, 'orders.json')

    if (!fs.existsSync(ordersPath)) {
        console.error(`❌ File not found: ${ordersPath}`)
        return
    }

    const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'))

    // Pick the first order
    const order = orders[0]
    console.log(`🧪 Testing Order ID: ${order.id}`)

    const { orderItems, ...orderData } = order

    // Clean up orderItems for nested create
    const cleanOrderItems = orderItems.map(item => {
        const { orderId, ...rest } = item
        return rest
    })

    console.log('📦 Cleaned OrderItems:', cleanOrderItems)

    try {
        await prisma.order.create({
            data: {
                ...orderData,
                orderItems: {
                    create: cleanOrderItems
                }
            }
        })
        console.log('✅ Order created successfully!')
    } catch (e) {
        console.error('❌ Error creating order:')
        console.error(e.message)
        console.error('--- Full Error ---')
        console.dir(e, { depth: null })
    } finally {
        await prisma.$disconnect()
    }
}

main()
