// Test script to check database connection and cart API
import { prisma } from '../../lib/prisma.js'

async function testCartAPI() {
    try {
        console.log('Testing database connection...')

        // Test database connection
        await prisma.$connect()
        console.log('✓ Database connected successfully')

        // Test fetching a cart
        const testUserId = 'test-user-id'
        console.log(`\nTesting cart fetch for userId: ${testUserId}`)

        const cart = await prisma.cart.findUnique({
            where: { userId: testUserId },
            include: { items: true }
        })

        if (!cart) {
            console.log('✓ No cart found (this is expected for a non-existent user)')
        } else {
            console.log('✓ Cart found:', cart)
        }

        // Test fetching all carts
        console.log('\nTesting fetch all carts...')
        const allCarts = await prisma.cart.findMany({
            take: 5,
            include: { items: true }
        })
        console.log(`✓ Found ${allCarts.length} carts in database`)

        console.log('\n✅ All tests passed!')

    } catch (error) {
        console.error('❌ Error:', error.message)
        console.error('Stack:', error.stack)
    } finally {
        await prisma.$disconnect()
    }
}

testCartAPI()
