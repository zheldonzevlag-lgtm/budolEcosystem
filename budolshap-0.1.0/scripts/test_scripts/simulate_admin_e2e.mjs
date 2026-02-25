import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

async function simulateAdminEndpoints() {
    const email = 'reynaldomgalvez@gmail.com'
    console.log(`\n--- Simulating Admin API Access for ${email} ---`)

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, isAdmin: true, accountType: true, role: true }
    })

    if (!user) {
        console.error('User not found')
        return
    }

    console.log('Admin Status:', user.isAdmin ? 'TRUE' : 'FALSE')
    console.log('Account Type:', user.accountType)

    // Mocking verifyAdminAccess from lib/adminAuth.js
    const mockVerifyAdminAccess = (userRecord) => {
        // This mirrors the logic in isUserAdmin
        const isAdminFlag = userRecord.isAdmin === true
        const isTypeAdmin = userRecord.accountType === 'ADMIN'
        const isConfiguredAdmin = false // Not checking email list for this simulation
        
        const isAuthorized = isAdminFlag || isTypeAdmin || isConfiguredAdmin
        
        return {
            isAdmin: isAuthorized,
            user: isAuthorized ? userRecord : null,
            error: isAuthorized ? null : 'Unauthorized. Admin access required.'
        }
    }

    const authResult = mockVerifyAdminAccess(user)
    console.log(`Authorization Result: ${authResult.isAdmin ? 'AUTHORIZED' : 'DENIED'}`)

    if (authResult.isAdmin) {
        console.log('\nTesting critical endpoints logic:')
        
        // Test 1: Dashboard Analytics
        console.log('1. Checking Analytics logic...')
        const orders = await prisma.order.count()
        const users = await prisma.user.count()
        console.log(`   - Data fetch simulation: OK (Orders: ${orders}, Users: ${users})`)

        // Test 2: User Management
        console.log('2. Checking User Management logic...')
        const recentUsers = await prisma.user.findMany({ take: 5, select: { email: true } })
        console.log(`   - Data fetch simulation: OK (${recentUsers.length} users retrieved)`)

        // Test 3: Webhooks
        console.log('3. Checking Webhook logic...')
        const webhooks = await prisma.webhookEvent.count()
        console.log(`   - Data fetch simulation: OK (Webhook events: ${webhooks})`)
        
        console.log('\nConclusion: User has full server-side access to all admin APIs.')
    } else {
        console.error('\nConclusion: User is DENIED access. Check isUserAdmin logic in lib/adminAccess.js')
    }

    console.log('\n--- Simulation Complete ---')
}

simulateAdminEndpoints()
    .catch(err => console.error(err))
    .finally(async () => await prisma.$disconnect())
