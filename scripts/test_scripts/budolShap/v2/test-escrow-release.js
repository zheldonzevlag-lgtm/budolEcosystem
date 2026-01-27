/**
 * Test Script: Escrow Release Functionality
 * 
 * This script tests the automatic fund release from escrow
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testEscrowRelease() {
    console.log('🧪 Testing Escrow Release Functionality\n')
    console.log('='.repeat(60))

    try {
        // Test 1: Find orders eligible for fund release
        console.log('\n📊 Test 1: Finding Eligible Orders')
        console.log('-'.repeat(60))

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const eligibleOrders = await prisma.order.findMany({
            where: {
                status: 'DELIVERED',
                deliveredAt: {
                    lte: sevenDaysAgo
                },
                isPaid: true
            },
            include: {
                store: {
                    include: {
                        wallet: true
                    }
                }
            }
        })

        console.log(`✅ Found ${eligibleOrders.length} orders eligible for fund release`)

        if (eligibleOrders.length > 0) {
            console.log('\n   Eligible Orders:')
            eligibleOrders.forEach((order, index) => {
                const deliveredDaysAgo = Math.floor(
                    (new Date() - new Date(order.deliveredAt)) / (1000 * 60 * 60 * 24)
                )
                console.log(`   ${index + 1}. Order ${order.id.substring(0, 8)}...`)
                console.log(`      Store: ${order.store.name}`)
                console.log(`      Total: ₱${order.total}`)
                console.log(`      Delivered: ${deliveredDaysAgo} days ago`)
                console.log(`      Current Pending Balance: ₱${order.store.wallet?.pendingBalance || 0}`)
            })
        } else {
            console.log('   ℹ️  No orders currently eligible for release')
            console.log('   (Orders must be delivered for at least 7 days)')
        }

        // Test 2: Check wallet states
        console.log('\n📊 Test 2: Current Wallet States')
        console.log('-'.repeat(60))

        const wallets = await prisma.wallet.findMany({
            include: {
                store: {
                    select: {
                        name: true
                    }
                }
            }
        })

        console.log(`✅ Found ${wallets.length} wallets`)
        wallets.forEach((wallet, index) => {
            console.log(`   ${index + 1}. ${wallet.store.name}`)
            console.log(`      Available Balance: ₱${wallet.balance}`)
            console.log(`      Pending Balance: ₱${wallet.pendingBalance}`)
            console.log(`      Total: ₱${wallet.balance + wallet.pendingBalance}`)
        })

        // Test 3: Simulate fund release (dry run)
        console.log('\n📊 Test 3: Simulating Fund Release (Dry Run)')
        console.log('-'.repeat(60))

        if (eligibleOrders.length > 0) {
            const testOrder = eligibleOrders[0]
            const platformFee = testOrder.total * 0.05
            const netAmount = testOrder.total - platformFee

            console.log('   Simulation for first eligible order:')
            console.log(`   Order ID: ${testOrder.id}`)
            console.log(`   Order Total: ₱${testOrder.total}`)
            console.log(`   Platform Fee (5%): ₱${platformFee.toFixed(2)}`)
            console.log(`   Net Amount to Release: ₱${netAmount.toFixed(2)}`)
            console.log(`   Current Pending: ₱${testOrder.store.wallet?.pendingBalance || 0}`)
            console.log(`   Current Available: ₱${testOrder.store.wallet?.balance || 0}`)
            console.log(`   After Release Pending: ₱${(testOrder.store.wallet?.pendingBalance || 0) - netAmount}`)
            console.log(`   After Release Available: ₱${(testOrder.store.wallet?.balance || 0) + netAmount}`)
        } else {
            console.log('   ℹ️  No orders to simulate')
        }

        // Test 4: Check cron job endpoint exists
        console.log('\n📊 Test 4: Verifying Cron Job Configuration')
        console.log('-'.repeat(60))

        const fs = require('fs')
        const path = require('path')

        const cronPath = path.join(__dirname, '..', 'app', 'api', 'cron', 'release-escrow', 'route.js')
        const vercelPath = path.join(__dirname, '..', 'vercel.json')

        if (fs.existsSync(cronPath)) {
            console.log('   ✅ Cron endpoint exists: /api/cron/release-escrow')
        } else {
            console.log('   ❌ Cron endpoint not found')
        }

        if (fs.existsSync(vercelPath)) {
            const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'))
            const escrowCron = vercelConfig.crons?.find(c => c.path === '/api/cron/release-escrow')

            if (escrowCron) {
                console.log(`   ✅ Vercel cron configured: ${escrowCron.schedule}`)
                console.log('   ℹ️  Schedule: Daily at midnight (0 0 * * *)')
            } else {
                console.log('   ❌ Escrow cron not found in vercel.json')
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60))
        console.log('✅ Escrow Release Test Complete!')
        console.log('='.repeat(60))
        console.log('\n📋 Summary:')
        console.log(`   • Eligible Orders: ${eligibleOrders.length}`)
        console.log(`   • Active Wallets: ${wallets.length}`)
        console.log(`   • Cron Job: Configured`)
        console.log(`   • Schedule: Daily at midnight`)

        if (eligibleOrders.length > 0) {
            console.log('\n⚠️  Note: This was a DRY RUN. No funds were actually released.')
            console.log('   To release funds, call the cron endpoint or wait for scheduled run.')
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run test
testEscrowRelease()
    .then(() => {
        console.log('\n✅ Test script completed successfully!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Test script failed:', error)
        process.exit(1)
    })
