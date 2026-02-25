
const { PrismaClient } = require('@prisma/client')
// Load .env (simplified)
require('dotenv').config()

const prisma = new PrismaClient()

async function seedOrder() {
    try {
        console.log('🔍 Finding users and products...')

        const steve = await prisma.user.findFirst({ where: { email: 'steve.rogers@budolshap.com' }, include: { Address: true } })
        const bruce = await prisma.user.findFirst({ where: { email: 'bruce.wayne@budolshap.com' }, include: { store: true } })
        const product = await prisma.product.findFirst({ where: { storeId: bruce.store.id } })

        if (!steve || !bruce || !product) {
            console.error('❌ Missing seeded data. Run seed-users-prod.js first.')
            return
        }

        console.log(`✅ Found Buyer: ${steve.name}`)
        console.log(`✅ Found Seller: ${bruce.name} (Store: ${bruce.store.name})`)
        console.log(`✅ Found Product: ${product.name}`)

        // Create Order
        console.log('\n📦 Creating Order...')
        const order = await prisma.order.create({
            data: {
                userId: steve.id,
                storeId: bruce.store.id,
                addressId: steve.Address[0].id,
                total: product.price + 50, // + shipping
                shippingCost: 50,
                status: 'PAID', // Ready for booking
                isPaid: true,
                paymentMethod: 'GCASH',
                paymentStatus: 'paid',
                paidAt: new Date(),
                orderItems: {
                    create: {
                        productId: product.id,
                        quantity: 1,
                        price: product.price
                    }
                }
            }
        })

        console.log(`✅ Order Created: #${order.id}`)
        console.log(`   Status: ${order.status}`)
        console.log(`   Total: ${order.total}`)

    } catch (e) {
        console.error('❌ Error creating order:', e)
    } finally {
        await prisma.$disconnect()
    }
}

seedOrder()
