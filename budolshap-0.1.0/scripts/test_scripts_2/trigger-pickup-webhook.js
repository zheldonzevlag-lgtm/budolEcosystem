/**
 * Trigger PICKED_UP webhook for local testing
 * Uses production database but local webhook secret
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const http = require('http')

// Load production database URL
const prodEnvPath = path.join(__dirname, '..', '.env.production')
const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf-8')
const dbUrlMatch = prodEnvContent.match(/DATABASE_URL="([^"]+)"/)
const DATABASE_URL = dbUrlMatch[1].replace(/\n/g, '')

// Load local webhook secret (same as what dev server uses)
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
const WEBHOOK_SECRET = process.env.LALAMOVE_WEBHOOK_SECRET

if (!WEBHOOK_SECRET) {
    console.error('❌ LALAMOVE_WEBHOOK_SECRET not found in .env.local')
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

        console.log('Sending webhook with:')
        console.log('  Body length:', body.length)
        console.log('  Signature:', signature)

        const options = {
            method: 'POST',
            hostname: 'localhost',
            port: 3000,
            path: '/api/webhooks/lalamove',
            headers: {
                'Content-Type': 'application/json',
                'x-lalamove-signature': signature,
                'Content-Length': Buffer.byteLength(body)
            }
        }

        const req = http.request(options, (res) => {
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
    console.log('🔍 Finding latest PROCESSING order...\n')

    const order = await prisma.order.findFirst({
        where: { status: 'PROCESSING' },
        orderBy: { createdAt: 'desc' },
        include: { user: true, store: true }
    })

    if (!order) {
        console.error('❌ No PROCESSING order found')
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

    // Simulate PICKED_UP event with vehicleType
    console.log('📦 Sending PICKED_UP webhook...\n')

    const payload = {
        orderId: bookingId,
        event: 'PICKED_UP',
        status: 'PICKED_UP',
        driver: {
            name: 'Juan Dela Cruz',
            phone: '+631001234567',
            plateNumber: 'ABC 1234',
            vehicleType: 'Motorcycle'
        },
        location: {
            lat: '14.5505',
            lng: '121.0260'
        },
        timestamp: new Date().toISOString()
    }

    try {
        const result = await sendWebhook(payload)
        console.log('\n✅ Webhook sent successfully!')
        console.log('   Response:', result.data)

        // Verify update
        const updated = await prisma.order.findUnique({
            where: { id: order.id }
        })

        console.log(`\n✅ Order status updated: ${updated.status}`)
        console.log(`   Shipped at: ${updated.shippedAt}`)
        console.log(`\n📋 Driver info stored:`)
        console.log(JSON.stringify(updated.shipping?.driver, null, 2))

    } catch (error) {
        console.error('\n❌ Webhook failed:', error.message)
    }

    await prisma.$disconnect()
}

main()
