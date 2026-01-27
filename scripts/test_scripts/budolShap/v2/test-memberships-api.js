// Test script to verify the admin memberships API
// Run with: node scripts/test-memberships-api.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testMembershipsAPI() {
    try {
        console.log('\n=== Testing Memberships API Logic ===\n')

        // Fetch all users with pending membership applications
        const applications = await prisma.user.findMany({
            where: {
                OR: [
                    { membershipStatus: 'PENDING' },
                    { coopMembershipStatus: 'PENDING' }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                membershipStatus: true,
                coopMembershipStatus: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        console.log('Pending Applications Found:', applications.length)
        console.log('\nApplications:')
        applications.forEach(app => {
            console.log(`\n- ${app.name} (${app.email})`)
            console.log(`  Plus Membership: ${app.membershipStatus}`)
            console.log(`  Coop Membership: ${app.coopMembershipStatus}`)
        })

        // Also check all users and their membership status
        console.log('\n\n=== All Users Membership Status ===\n')
        const allUsers = await prisma.user.findMany({
            select: {
                name: true,
                email: true,
                membershipStatus: true,
                coopMembershipStatus: true,
                isMember: true,
                isCoopMember: true
            }
        })

        allUsers.forEach(user => {
            console.log(`${user.name} (${user.email})`)
            console.log(`  Plus: ${user.membershipStatus} (isMember: ${user.isMember})`)
            console.log(`  Coop: ${user.coopMembershipStatus} (isCoopMember: ${user.isCoopMember})`)
            console.log('---')
        })

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testMembershipsAPI()
