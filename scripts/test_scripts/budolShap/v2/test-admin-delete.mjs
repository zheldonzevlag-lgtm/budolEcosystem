// Test script to verify admin authentication is working
// Run with: node scripts/test-admin-delete.mjs

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAdminAuth() {
    try {
        console.log('🧪 Testing Admin Authentication...\n')

        // Find admin user
        const admin = await prisma.user.findFirst({
            where: {
                OR: [
                    { isAdmin: true },
                    { accountType: 'ADMIN' }
                ]
            }
        })

        if (!admin) {
            console.log('❌ No admin user found in database')
            return
        }

        console.log('✅ Admin user found:')
        console.log(`   Email: ${admin.email}`)
        console.log(`   Name: ${admin.name}`)
        console.log(`   isAdmin: ${admin.isAdmin}`)
        console.log(`   accountType: ${admin.accountType}`)
        console.log('')

        // Find a test user to delete
        const testUser = await prisma.user.findFirst({
            where: {
                AND: [
                    { isAdmin: false },
                    { accountType: 'BUYER' }
                ]
            },
            include: {
                store: true,
                buyerOrders: true
            }
        })

        if (!testUser) {
            console.log('❌ No test user found')
            return
        }

        console.log('✅ Test user found:')
        console.log(`   Email: ${testUser.email}`)
        console.log(`   Name: ${testUser.name}`)
        console.log(`   Has store: ${testUser.store ? 'Yes' : 'No'}`)
        console.log(`   Orders: ${testUser.buyerOrders.length}`)
        console.log('')

        console.log('📝 To test deletion:')
        console.log(`   1. Log in as: ${admin.email}`)
        console.log(`   2. Go to: http://localhost:3000/admin/users`)
        console.log(`   3. Click Delete on: ${testUser.name}`)
        console.log(`   4. Open browser console (F12) and check Network tab`)
        console.log('')

        console.log('🔍 Expected behavior:')
        console.log('   - Confirmation dialog appears')
        console.log('   - DELETE request to /api/admin/users/' + testUser.id)
        console.log('   - If auth fails: 403 Forbidden error in console')
        console.log('   - If auth succeeds: User deleted successfully')
        console.log('')

        console.log('🐛 Debugging steps if it fails:')
        console.log('   1. Check browser console for errors')
        console.log('   2. Check Network tab for the DELETE request')
        console.log('   3. Look at the response status code')
        console.log('   4. Check if cookies are being sent with the request')

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testAdminAuth()
