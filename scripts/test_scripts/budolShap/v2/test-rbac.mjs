import { PrismaClient } from '@prisma/client'
import { ROLES, PERMISSIONS, hasPermission } from '../lib/rbac.js'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function testRBAC() {
    console.log('--- Starting BudolShap RBAC Test ---')

    // 1. Test Static RBAC Logic
    console.log('\n1. Testing Static RBAC Logic:')
    const adminCanEditSettings = hasPermission(ROLES.ADMIN, PERMISSIONS.SETTINGS_EDIT)
    const staffCanEditSettings = hasPermission(ROLES.STAFF, PERMISSIONS.SETTINGS_EDIT)
    const staffCanViewUsers = hasPermission(ROLES.STAFF, PERMISSIONS.USERS_VIEW)

    console.log(`- Admin can edit settings: ${adminCanEditSettings} (Expected: true)`)
    console.log(`- Staff can edit settings: ${staffCanEditSettings} (Expected: false)`)
    console.log(`- Staff can view users: ${staffCanViewUsers} (Expected: true)`)

    if (adminCanEditSettings && !staffCanEditSettings && staffCanViewUsers) {
        console.log('✅ Static RBAC logic passed!')
    } else {
        console.error('❌ Static RBAC logic failed!')
    }

    // 2. Test Database Integration
    console.log('\n2. Testing Database Integration:')
    try {
        const testUserEmail = 'rbac-test-staff@budolecosystem.com'
        
        // Clean up
        await prisma.user.deleteMany({ where: { email: testUserEmail } })

        // Create a staff user
        const staffUser = await prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                email: testUserEmail,
                name: 'RBAC Test Staff',
                password: 'MOCK_PASSWORD',
                phoneNumber: '+639111111111',
                image: 'https://ui-avatars.com/api/?name=RBAC+Staff',
                accountType: 'ADMIN', // Still needs to be ADMIN to access admin portal
                isAdmin: true,
                role: ROLES.STAFF,
                permissions: [] // No explicit overrides
            }
        })

        console.log(`- Created test staff user with ID: ${staffUser.id}`)
        console.log(`- User Role: ${staffUser.role}`)

        // Verify database retrieval
        const retrievedUser = await prisma.user.findUnique({
            where: { id: staffUser.id }
        })

        if (retrievedUser.role === ROLES.STAFF) {
            console.log('✅ Database RBAC storage passed!')
        } else {
            console.error('❌ Database RBAC storage failed!')
        }

        // Clean up
        await prisma.user.delete({ where: { id: staffUser.id } })
        
    } catch (error) {
        console.error('❌ Database integration test failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testRBAC()
