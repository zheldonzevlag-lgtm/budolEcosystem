/**
 * Test CANCELLED Status in Production
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

async function testCancelledStatus() {
    console.log('🚀 Testing CANCELLED Status in Production\n')

    try {
        // 1. Find valid test data
        console.log('1️⃣  Finding valid test data...')
        const user = await prisma.user.findFirst({
            where: { Address: { some: {} } },
            include: { Address: true }
        })
        const store = await prisma.store.findFirst({
            where: { Product: { some: {} } },
            include: { Product: true }
        })

        if (!user || !store) throw new Error('Missing test data')

        const address = user.Address[0]
        const product = store.Product[0]

        // 2. Create Order
        console.log('\n2️⃣  Creating Test Order...')
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                storeId: store.id,
                addressId: address.id,
                total: product.price,
                status: 'ORDER_PLACED',
                paymentMethod: 'COD',
                orderItems: {
                    create: {
                        productId: product.id,
                        quantity: 1,
                        price: product.price
                    }
                }
            }
        })
        console.log(`   ✅ Order created: ${order.id}`)
        console.log(`   Status: ${order.status}`)

        // 3. Update to CANCELLED
        console.log('\n3️⃣  Updating to CANCELLED...')
        const cancelledOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'CANCELLED'
            }
        })

        console.log(`   ✅ Order updated`)
        console.log(`   Status: ${cancelledOrder.status}`)

        if (cancelledOrder.status === 'CANCELLED') {
            console.log('\n✨ SUCCESS! CANCELLED status is working correctly.')
        } else {
            console.log('\n❌ FAILED! Status did not update correctly.')
        }

        // Cleanup
        console.log('\n🧹 Cleaning up test order...')
        await prisma.order.delete({ where: { id: order.id } })
        console.log('   ✅ Test order deleted')

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

testCancelledStatus()
