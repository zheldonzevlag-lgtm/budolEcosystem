/**
 * Trigger COMPLETED webhook for the current order
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const https = require('https')

// Load production environment variables
const envPath = path.join(__dirname, '..', '.env.production')
const envContent = fs.readFileSync(envPath, 'utf-8')

const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/)
const DATABASE_URL = dbUrlMatch[1].replace(/\n/g, '')

const secretMatch = envContent.match(/LALAMOVE_WEBHOOK_SECRET="?([^"\n]+)"?/)
const WEBHOOK_SECRET = secretMatch ? secretMatch[1] : null

if (!WEBHOOK_SECRET) {
    console.error('❌ LALAMOVE_WEBHOOK_SECRET not found')
    process.exit(1)
}

const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
})

function sendWebhook(payload) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload)
        const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET)
        const signature = hmac.update(body).digest('hex')

        const options = {
            method: 'POST',
            hostname: 'budolshap.vercel.app',
            path: '/api/webhooks/lalamove',
            headers: {
                'Content-Type': 'application/json',
                'x-lalamove-signature': signature,
                'Content-Length': Buffer.byteLength(body)
            }
        }

        const req = https.request(options, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve({ status: res.statusCode, data: JSON.parse(data) })
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`))
                }
            })
        })

        req.on('error', reject)
        req.write(body)
        req.end()
    })
}

async function main() {
    console.log('🔍 Finding latest SHIPPED order...\n')

    const order = await prisma.order.findFirst({
        where: { status: 'SHIPPED' },
        orderBy: { createdAt: 'desc' },
        include: { user: true, store: true }
    })

    if (!order) {
        console.error('❌ No SHIPPED order found')
        process.exit(1)
    }

    const bookingId = order.shipping?.bookingId
    if (!bookingId) {
        console.error('❌ Order has no Lalamove booking ID')
        process.exit(1)
    }

    console.log(`✅ Found order: ${order.id}`)
    console.log(`   Booking ID: ${bookingId}`)
    console.log(`   Customer: ${order.user.email}`)
    console.log(`   Store: ${order.store.name}\n`)

    // Simulate COMPLETED event
    console.log('🎉 Sending COMPLETED webhook...')

    const payload = {
        orderId: bookingId,
        event: 'COMPLETED',
        status: 'COMPLETED',
        driver: {
            name: 'Juan Dela Cruz',
            phone: '+631001234567',
            plateNumber: 'ABC 1234'
        },
        location: {
            lat: '14.5505',
            lng: '121.0260'
        },
        actualDeliveryTime: new Date().toISOString(),
        timestamp: new Date().toISOString()
    }

    try {
        const result = await sendWebhook(payload)
        console.log('✅ Webhook sent successfully!')
        console.log('   Response:', result.data)

        // Verify update
        const updated = await prisma.order.findUnique({
            where: { id: order.id }
        })

        console.log(`\n✅ Order status updated: ${updated.status}`)
        console.log(`   Delivered at: ${updated.deliveredAt}`)
        console.log(`   Auto-complete at: ${updated.autoCompleteAt}`)

    } catch (error) {
        console.error('❌ Webhook failed:', error.message)
    }

    await prisma.$disconnect()
}

main()
