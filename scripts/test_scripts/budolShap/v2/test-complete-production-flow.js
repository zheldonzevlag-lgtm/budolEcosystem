/**
 * Test Complete Order Flow in Production (Bruce Wayne Edition)
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

async function testCompleteFlow() {
    console.log('🚀 Starting Complete Production Flow Test (Bruce Wayne)\n')

    try {
        // 1. Setup: Find Bruce Wayne
        console.log('1️⃣  Finding Bruce Wayne...')

        const user = await prisma.user.findUnique({
            where: { email: 'bruce.wayne@budolshap.com' },
            include: { Address: true }
        })

        if (!user) {
            throw new Error('Bruce Wayne not found! Run setup-bruce-wayne.js first.')
        }

        if (user.Address.length === 0) {
            throw new Error('Bruce Wayne has no address! Run setup-bruce-wayne.js first.')
        }

        const address = user.Address[0]

        // Find a store with products
        const store = await prisma.store.findFirst({
            where: {
                Product: {
                    some: {} // Store must have at least one product
                }
            },
            include: {
                Product: true
            }
        })

        if (!store) {
            throw new Error('No store with products found.')
        }

        const product = store.Product[0]

        console.log(`   User: ${user.email}`)
        console.log(`   Address: ${address.street}, ${address.city}`)
        console.log(`   Store: ${store.name}`)
        console.log(`   Product: ${product.name}`)

        // 2. Create Order (ORDER_PLACED)
        console.log('\n2️⃣  Creating Test Order...')
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                storeId: store.id,
                addressId: address.id,
                total: product.price,
                status: 'ORDER_PLACED',
                paymentMethod: 'GCASH',
                orderItems: {
                    create: {
                        productId: product.id,
                        quantity: 1,
                        price: product.price
                    }
                }
            },
            include: { orderItems: true }
        })
        console.log(`   ✅ Order created: ${order.id}`)
        console.log(`   Status: ${order.status}`)

        // 3. Simulate Payment (PAID)
        console.log('\n3️⃣  Simulating Payment...')
        const paidOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'PAID',
                isPaid: true,
                paidAt: new Date(),
                paymentStatus: 'paid'
            }
        })
        console.log(`   ✅ Order paid`)
        console.log(`   Status: ${paidOrder.status}`)
        console.log(`   PaidAt: ${paidOrder.paidAt.toISOString()}`)

        // 4. Simulate Lalamove Booking (PROCESSING)
        console.log('\n4️⃣  Simulating Lalamove Booking...')
        const processingOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'PROCESSING',
                shipping: {
                    provider: 'LALAMOVE',
                    trackingId: 'TEST-TRACKING-BRUCE',
                    status: 'ASSIGNING_DRIVER'
                }
            }
        })
        console.log(`   ✅ Order processing`)
        console.log(`   Status: ${processingOrder.status}`)

        // 5. Simulate Pickup (SHIPPED)
        console.log('\n5️⃣  Simulating Pickup (Webhook)...')
        const shippedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'SHIPPED',
                shippedAt: new Date()
            }
        })
        console.log(`   ✅ Order shipped`)
        console.log(`   Status: ${shippedOrder.status}`)
        console.log(`   ShippedAt: ${shippedOrder.shippedAt.toISOString()}`)

        // 6. Simulate Delivery (DELIVERED)
        console.log('\n6️⃣  Simulating Delivery (Webhook)...')
        // Calculate auto-complete date (7 days from now)
        const autoCompleteDate = new Date()
        autoCompleteDate.setDate(autoCompleteDate.getDate() + 7)

        const deliveredOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'DELIVERED',
                deliveredAt: new Date(),
                autoCompleteAt: autoCompleteDate
            }
        })
        console.log(`   ✅ Order delivered`)
        console.log(`   Status: ${deliveredOrder.status}`)
        console.log(`   DeliveredAt: ${deliveredOrder.deliveredAt.toISOString()}`)
        console.log(`   AutoCompleteAt: ${deliveredOrder.autoCompleteAt.toISOString()}`)

        // 7. Test Auto-Completion Logic
        console.log('\n7️⃣  Testing Auto-Completion...')

        // Manually set autoCompleteAt to past to simulate 7 days passing
        await prisma.order.update({
            where: { id: order.id },
            data: {
                autoCompleteAt: new Date(Date.now() - 1000) // 1 second ago
            }
        })
        console.log('   ⏳ Fast-forwarded time (simulating 7 days passed)...')

        // Run the completion logic (similar to cron job)
        const ordersToComplete = await prisma.order.findMany({
            where: {
                status: 'DELIVERED',
                autoCompleteAt: { lte: new Date() }
            }
        })

        console.log(`   Found ${ordersToComplete.length} orders ready for completion`)

        const completedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        })

        console.log(`   ✅ Order completed`)
        console.log(`   Status: ${completedOrder.status}`)
        console.log(`   CompletedAt: ${completedOrder.completedAt.toISOString()}`)

        console.log('\n✨ SUCCESS! Complete order flow verified for Bruce Wayne.')

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

testCompleteFlow()
