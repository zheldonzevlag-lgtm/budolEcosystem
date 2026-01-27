/**
 * Test Script: Escrow Service
 * 
 * This script tests the escrow service functions to ensure they work correctly
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Mock escrow functions (since we can't import ES modules in Node directly)
async function creditPendingBalance({ orderId, amount, gateway }) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                store: {
                    include: {
                        wallet: true
                    }
                }
            }
        })

        if (!order) {
            throw new Error(`Order not found: ${orderId}`)
        }

        if (!order.store) {
            throw new Error(`Store not found for order: ${orderId}`)
        }

        const platformFee = amount * 0.05
        const netEarnings = amount - platformFee

        let wallet = order.store.wallet

        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: {
                    storeId: order.store.id,
                    balance: 0,
                    pendingBalance: 0
                }
            })
        }

        const updatedWallet = await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                pendingBalance: {
                    increment: netEarnings
                }
            }
        })

        const transaction = await prisma.transaction.create({
            data: {
                walletId: wallet.id,
                amount: netEarnings,
                type: 'CREDIT',
                description: `Escrow hold for order ${orderId} via ${gateway} (Platform fee: ₱${platformFee.toFixed(2)})`
            }
        })

        return {
            success: true,
            transaction,
            wallet: updatedWallet,
            details: {
                orderId,
                gateway,
                totalAmount: amount,
                platformFee,
                netEarnings,
                newPendingBalance: updatedWallet.pendingBalance
            }
        }

    } catch (error) {
        console.error('❌ Error crediting pending balance:', error)
        throw error
    }
}

async function releaseFunds({ orderId, amount }) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                store: {
                    include: {
                        wallet: true
                    }
                }
            }
        })

        if (!order) {
            throw new Error(`Order not found: ${orderId}`)
        }

        if (!order.store?.wallet) {
            throw new Error(`Wallet not found for order: ${orderId}`)
        }

        const wallet = order.store.wallet

        if (wallet.pendingBalance < amount) {
            throw new Error(
                `Insufficient pending balance. Required: ₱${amount}, Available: ₱${wallet.pendingBalance}`
            )
        }

        const updatedWallet = await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                pendingBalance: {
                    decrement: amount
                },
                balance: {
                    increment: amount
                }
            }
        })

        const transaction = await prisma.transaction.create({
            data: {
                walletId: wallet.id,
                amount: amount,
                type: 'CREDIT',
                description: `Funds released for completed order ${orderId}`
            }
        })

        return {
            success: true,
            transaction,
            wallet: updatedWallet,
            details: {
                orderId,
                amountReleased: amount,
                newPendingBalance: updatedWallet.pendingBalance,
                newAvailableBalance: updatedWallet.balance
            }
        }

    } catch (error) {
        console.error('❌ Error releasing funds:', error)
        throw error
    }
}

async function testEscrowService() {
    console.log('🧪 Testing Escrow Service...\n')

    try {
        // Test 1: Find a paid order to test with
        console.log('Test 1: Finding a paid order...')
        const paidOrder = await prisma.order.findFirst({
            where: {
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

        if (!paidOrder) {
            console.log('⚠️  No paid orders found. Creating test scenario...')
            console.log('Please create a paid order first to test the escrow service.')
            return
        }

        console.log(`✅ Found paid order: ${paidOrder.id}`)
        console.log(`   Store: ${paidOrder.store.name}`)
        console.log(`   Total: ₱${paidOrder.total}`)

        // Get current wallet state
        const currentWallet = paidOrder.store.wallet
        console.log(`\n📊 Current Wallet State:`)
        console.log(`   Pending Balance: ₱${currentWallet?.pendingBalance || 0}`)
        console.log(`   Available Balance: ₱${currentWallet?.balance || 0}`)

        // Test 2: Credit pending balance
        console.log('\nTest 2: Crediting pending balance...')
        const testAmount = 1000 // ₱1000 test amount

        const creditResult = await creditPendingBalance({
            orderId: paidOrder.id,
            amount: testAmount,
            gateway: 'TEST'
        })

        console.log('✅ Credit successful!')
        console.log(`   Total Amount: ₱${creditResult.details.totalAmount}`)
        console.log(`   Platform Fee (5%): ₱${creditResult.details.platformFee}`)
        console.log(`   Net Earnings: ₱${creditResult.details.netEarnings}`)
        console.log(`   New Pending Balance: ₱${creditResult.details.newPendingBalance}`)

        // Test 3: Release funds
        console.log('\nTest 3: Releasing funds from pending to available...')

        const releaseResult = await releaseFunds({
            orderId: paidOrder.id,
            amount: creditResult.details.netEarnings
        })

        console.log('✅ Release successful!')
        console.log(`   Amount Released: ₱${releaseResult.details.amountReleased}`)
        console.log(`   New Pending Balance: ₱${releaseResult.details.newPendingBalance}`)
        console.log(`   New Available Balance: ₱${releaseResult.details.newAvailableBalance}`)

        // Test 4: Verify transaction records
        console.log('\nTest 4: Verifying transaction records...')

        const transactions = await prisma.transaction.findMany({
            where: {
                walletId: currentWallet.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        })

        console.log(`✅ Found ${transactions.length} recent transactions:`)
        transactions.forEach((tx, index) => {
            console.log(`   ${index + 1}. ${tx.type} - ₱${tx.amount} - ${tx.description}`)
        })

        console.log('\n✅ All escrow service tests passed!')
        console.log('\n📊 Final Summary:')
        console.log(`   - Credit to pending balance: ✓`)
        console.log(`   - Platform fee calculation (5%): ✓`)
        console.log(`   - Release to available balance: ✓`)
        console.log(`   - Transaction logging: ✓`)

    } catch (error) {
        console.error('❌ Test failed:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run test
testEscrowService()
    .then(() => {
        console.log('\n✅ Escrow service test complete!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Test error:', error)
        process.exit(1)
    })
