
const { PrismaClient } = require('@prisma/client')
const axios = require('axios')
const crypto = require('crypto')
require('dotenv').config()

const prisma = new PrismaClient()

// Configuration
// Using the deployment URL provided by user context or defaulting to localhost if testing locally
const APP_URL = 'https://budolshap-v3-j81ea1fen-jon-galvezs-projects-f5372ed2.vercel.app';
const WEBHOOK_SECRET = process.env.LALAMOVE_WEBHOOK_SECRET || 'failed_secret'; // We might not have the secret

async function runTest() {
    try {
        console.log('🧪 Starting Phase 1 & 2 Backend Verification Test...\n')

        // 1. Get the test order
        const order = await prisma.order.findFirst({
            where: {
                user: { email: 'steve.rogers@budolshap.com' },
                status: 'PAID'
            },
            orderBy: { createdAt: 'desc' }
        })

        if (!order) {
            console.error('❌ No PAID order found for Steve. Run seed-order-prod.js first.')
            return
        }

        console.log(`📦 Found Order: ${order.id}`)

        // 2. Mock 'Booked' State
        console.log('🔄 Mocking "Booked" state (Simulating Lalamove Booking)...')
        await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'PROCESSING', // or 'SHIPPED'
                shipping: {
                    provider: 'lalamove',
                    bookingId: `TEST_BOOKING_${Date.now()}`,
                    status: 'ASSIGNING_DRIVER',
                    shareLink: 'https://lalamove.app/tracking/123'
                }
            }
        })
        console.log('✅ Order updated to Booked state.')

        // 3. Trigger Webhook (CANCELLED)
        console.log('\n📨 Triggering CANCELLED Webhook...')

        const payload = {
            eventType: 'CANCELLED', // or CANCELED
            orderId: order.id, // Some events put ID here
            data: {
                order: {
                    orderId: `TEST_BOOKING_${Date.now()}`, // Should match bookingId in DB? 
                    // Actually our webhook lookup matches bookingId. 
                    // We need to fetch the updated order first to get the fake booking ID.
                }
            }
        }

        // Refetch to get the booking ID we just set
        const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } })
        payload.data.order.orderId = updatedOrder.shipping.bookingId;
        payload.data.order.status = 'CANCELED'; // Lalamove uses CANCELED or CANCELLED

        console.log(`   Event: CANCELLED`)
        console.log(`   Booking ID: ${payload.data.order.orderId}`)

        // Send Request
        // Note: Signature verification is disabled in code ("TEMPORARILY DISABLED"), so we don't need real sig.
        try {
            const res = await axios.post(`${APP_URL}/api/webhooks/lalamove`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Lalamove-Signature': 'fake_sig'
                }
            })
            console.log(`✅ Webhook sent. Response: ${res.status}`)
        } catch (e) {
            console.error(`❌ Webhook request failed: ${e.message}`)
            if (e.response) console.error(e.response.data)
        }

        // 4. Verification
        console.log('\n🔍 Verifying Result in DB...')
        // Wait a bit for async processing if any (though webhook is mostly sync)
        await new Promise(r => setTimeout(r, 2000));

        const finalOrder = await prisma.order.findUnique({ where: { id: order.id } })
        console.log(`   Final Status: ${finalOrder.status} (Expected: PROCESSING)`)
        console.log(`   Failure Reason: ${finalOrder.shipping.failureReason} (Expected: CANCELED/CANCELLED)`)

        if (finalOrder.status === 'PROCESSING' && (finalOrder.shipping.failureReason === 'CANCELED' || finalOrder.shipping.failureReason === 'CANCELLED')) {
            console.log('✅ TEST PASSED: Order reverted to PROCESSING with failure reason.')
        } else {
            console.error('❌ TEST FAILED: Order status or failure reason incorrect.')
        }

        // 5. Verify Webhook Log (Phase 2)
        const log = await prisma.webhookEvent.findFirst({
            where: { orderId: order.id },
            orderBy: { createdAt: 'desc' }
        })

        if (log) {
            console.log(`✅ TEST PASSED: Webhook successfully logged (ID: ${log.id}, Status: ${log.status})`)
        } else {
            console.log('⚠️  Webhook log not found (Phase 2 might be missing or delayed)')
        }

    } catch (e) {
        console.error('❌ Test failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

runTest()
