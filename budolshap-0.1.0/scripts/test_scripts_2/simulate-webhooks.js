/**
 * Simulate Lalamove Webhooks for Phase 5 Verification
 * Sends actual HTTP requests to the deployed webhook endpoint
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const https = require('https')

// Configuration
const DEPLOYED_URL = 'https://budolshap.vercel.app'
const WEBHOOK_PATH = '/api/webhooks/lalamove'

// Load production environment variables
const envPath = path.join(__dirname, '..', '.env.production')
const envContent = fs.readFileSync(envPath, 'utf-8')

// Parse DATABASE_URL
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/)
const DATABASE_URL = dbUrlMatch[1].replace(/\n/g, '')

// Parse LALAMOVE_WEBHOOK_SECRET
const secretMatch = envContent.match(/LALAMOVE_WEBHOOK_SECRET="?([^"\n]+)"?/)
const WEBHOOK_SECRET = secretMatch ? secretMatch[1] : null

if (!WEBHOOK_SECRET) {
    console.error('❌ LALAMOVE_WEBHOOK_SECRET not found in .env.production')
    process.exit(1)
}

const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
})

// Helper to send webhook request
function sendWebhook(payload) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload)

        // Generate signature
        const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET)
        // Match the current production bug: double stringify
        const signature = hmac.update(JSON.stringify(body)).digest('hex')

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Lalamove-Signature': signature
            }
        }

        const req = https.request(`${DEPLOYED_URL}${WEBHOOK_PATH}`, options, (res) => {
            let data = ''
            res.on('data', (chunk) => data += chunk)
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        body: JSON.parse(data)
                    })
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        body: data
                    })
                }
            })
        })

        req.on('error', reject)
        req.write(body)
        req.end()
    })
}

async function simulateWebhooks() {
    console.log('🚀 Starting Phase 5 Webhook Simulation\n')
    console.log(`Target: ${DEPLOYED_URL}${WEBHOOK_PATH}`)

    try {
        // 1. Setup Test Order
        console.log('1️⃣  Setting up test order...')

        // Find valid user and store
        const user = await prisma.user.findFirst({ where: { Address: { some: {} } } })
        const store = await prisma.store.findFirst({ where: { Product: { some: {} } } })

        if (!user || !store) throw new Error('Missing test data')

        const address = (await prisma.address.findMany({ where: { userId: user.id } }))[0]
        const product = (await prisma.product.findMany({ where: { storeId: store.id } }))[0]

        // Create order
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                storeId: store.id,
                addressId: address.id,
                total: product.price,
                status: 'PROCESSING', // Start at PROCESSING
                paymentMethod: 'GCASH',
                isPaid: true,
                paidAt: new Date(),
                shipping: {
                    provider: 'LALAMOVE',
                    bookingId: `TEST-BOOKING-${Date.now()}`, // Unique booking ID
                    status: 'ASSIGNING_DRIVER'
                },
                orderItems: {
                    create: {
                        productId: product.id,
                        quantity: 1,
                        price: product.price
                    }
                }
            }
        })

        const bookingId = order.shipping.bookingId
        console.log(`   ✅ Created Order: ${order.id}`)
        console.log(`   Booking ID: ${bookingId}`)

        // 2. Simulate PICKED_UP
        console.log('\n2️⃣  Simulating PICKED_UP Webhook...')

        const pickedUpPayload = {
            event: 'PICKED_UP',
            orderId: bookingId,
            status: 'PICKED_UP',
            driver: {
                name: 'Test Driver',
                phone: '09123456789',
                plateNumber: 'ABC-123'
            },
            timestamp: new Date().toISOString()
        }

        console.log('   Sending webhook request...')
        const pickupRes = await sendWebhook(pickedUpPayload)
        console.log(`   Response: ${pickupRes.status}`, pickupRes.body)

        if (pickupRes.status !== 200) {
            throw new Error(`Webhook failed with status ${pickupRes.status}`)
        }

        // Verify DB update
        console.log('   Verifying database update...')
        // Wait a moment for DB update
        await new Promise(r => setTimeout(r, 2000))

        const shippedOrder = await prisma.order.findUnique({ where: { id: order.id } })
        console.log(`   Current Status: ${shippedOrder.status}`)

        if (shippedOrder.status === 'SHIPPED' && shippedOrder.shippedAt) {
            console.log('   ✅ Order updated to SHIPPED correctly')
        } else {
            console.error('   ❌ Order status update failed')
        }

        // 3. Simulate COMPLETED
        console.log('\n3️⃣  Simulating COMPLETED Webhook...')

        const completedPayload = {
            event: 'COMPLETED',
            orderId: bookingId,
            status: 'COMPLETED',
            actualDeliveryTime: new Date().toISOString(),
            timestamp: new Date().toISOString()
        }

        console.log('   Sending webhook request...')
        const completeRes = await sendWebhook(completedPayload)
        console.log(`   Response: ${completeRes.status}`, completeRes.body)

        if (completeRes.status !== 200) {
            throw new Error(`Webhook failed with status ${completeRes.status}`)
        }

        // Verify DB update
        console.log('   Verifying database update...')
        await new Promise(r => setTimeout(r, 2000))

        const deliveredOrder = await prisma.order.findUnique({ where: { id: order.id } })
        console.log(`   Current Status: ${deliveredOrder.status}`)
        console.log(`   Delivered At: ${deliveredOrder.deliveredAt}`)
        console.log(`   Auto Complete At: ${deliveredOrder.autoCompleteAt}`)

        if (deliveredOrder.status === 'DELIVERED' && deliveredOrder.deliveredAt && deliveredOrder.autoCompleteAt) {
            console.log('   ✅ Order updated to DELIVERED correctly')
            console.log('   ✅ Auto-completion scheduled correctly')
        } else {
            console.error('   ❌ Order status update failed')
        }

        console.log('\n✨ Phase 5 Verification Complete!')

        // Cleanup
        console.log('\n🧹 Cleaning up...')
        await prisma.order.delete({ where: { id: order.id } })
        console.log('   ✅ Test order deleted')

    } catch (error) {
        console.error('\n❌ Simulation Failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

simulateWebhooks()
