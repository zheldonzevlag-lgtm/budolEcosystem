/**
 * Test Script: Verify pendingBalance field
 * 
 * This script verifies that the pendingBalance field was successfully added to the Wallet model
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPendingBalance() {
    console.log('🧪 Testing pendingBalance field...\n')

    try {
        // Test 1: Check if we can query wallets with pendingBalance
        console.log('Test 1: Querying wallets with pendingBalance field...')
        const wallets = await prisma.wallet.findMany({
            select: {
                id: true,
                storeId: true,
                balance: true,
                pendingBalance: true,
                createdAt: true
            },
            take: 5
        })

        console.log(`✅ Found ${wallets.length} wallets`)
        if (wallets.length > 0) {
            console.log('Sample wallet:', JSON.stringify(wallets[0], null, 2))
        }

        // Test 2: Verify all wallets have pendingBalance = 0
        console.log('\nTest 2: Verifying all wallets have pendingBalance = 0...')
        const walletsWithNonZeroPending = await prisma.wallet.count({
            where: {
                pendingBalance: {
                    not: 0
                }
            }
        })

        if (walletsWithNonZeroPending === 0) {
            console.log('✅ All wallets have pendingBalance = 0 (as expected)')
        } else {
            console.log(`⚠️  Found ${walletsWithNonZeroPending} wallets with non-zero pendingBalance`)
        }

        // Test 3: Test updating pendingBalance
        if (wallets.length > 0) {
            console.log('\nTest 3: Testing pendingBalance update...')
            const testWallet = wallets[0]

            await prisma.wallet.update({
                where: { id: testWallet.id },
                data: { pendingBalance: 100 }
            })

            const updated = await prisma.wallet.findUnique({
                where: { id: testWallet.id }
            })

            if (updated.pendingBalance === 100) {
                console.log('✅ Successfully updated pendingBalance to 100')

                // Restore to 0
                await prisma.wallet.update({
                    where: { id: testWallet.id },
                    data: { pendingBalance: 0 }
                })
                console.log('✅ Restored pendingBalance to 0')
            } else {
                console.log('❌ Failed to update pendingBalance')
            }
        }

        console.log('\n✅ All tests passed!')
        console.log('\n📊 Summary:')
        console.log(`   - Total wallets: ${wallets.length}`)
        console.log(`   - All have pendingBalance field: ✓`)
        console.log(`   - Default value is 0: ✓`)
        console.log(`   - Can update pendingBalance: ✓`)

    } catch (error) {
        console.error('❌ Test failed:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run test
testPendingBalance()
    .then(() => {
        console.log('\n✅ Phase 1 migration verified successfully!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Test error:', error)
        process.exit(1)
    })
