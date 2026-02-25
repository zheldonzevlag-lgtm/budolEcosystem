// Create a test user with pending membership application
// Run with: node scripts/create-pending-member.js

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function createPendingMember() {
    try {
        console.log('\n=== Creating Test User with Pending Membership ===\n')

        const hashedPassword = await bcrypt.hash('password123', 10)

        // Create or update a test user with pending membership
        const user = await prisma.user.upsert({
            where: { email: 'testmember@example.com' },
            update: {
                membershipStatus: 'PENDING',
                isMember: false
            },
            create: {
                id: 'test-member-' + Date.now(),
                name: 'Test Member User',
                email: 'testmember@example.com',
                password: hashedPassword,
                image: 'https://ui-avatars.com/api/?name=Test+Member',
                accountType: 'BUYER',
                membershipStatus: 'PENDING',
                isMember: false
            }
        })

        console.log('✅ Created/Updated test user:')
        console.log(`   Name: ${user.name}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Membership Status: ${user.membershipStatus}`)
        console.log(`   isMember: ${user.isMember}`)

        // Also create one with pending coop membership
        const coopUser = await prisma.user.upsert({
            where: { email: 'testcoop@example.com' },
            update: {
                coopMembershipStatus: 'PENDING',
                isCoopMember: false
            },
            create: {
                id: 'test-coop-' + Date.now(),
                name: 'Test Coop Member',
                email: 'testcoop@example.com',
                password: hashedPassword,
                image: 'https://ui-avatars.com/api/?name=Test+Coop',
                accountType: 'BUYER',
                coopMembershipStatus: 'PENDING',
                isCoopMember: false
            }
        })

        console.log('\n✅ Created/Updated coop test user:')
        console.log(`   Name: ${coopUser.name}`)
        console.log(`   Email: ${coopUser.email}`)
        console.log(`   Coop Membership Status: ${coopUser.coopMembershipStatus}`)
        console.log(`   isCoopMember: ${coopUser.isCoopMember}`)

        console.log('\n✨ Test users created successfully!')
        console.log('You can now test the membership approval page.\n')

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createPendingMember()
