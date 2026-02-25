// Quick script to check admin user status
// Run with: node scripts/check-admin.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAdmin() {
    try {
        // Get all users and their admin status
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                isAdmin: true,
                accountType: true
            }
        })

        console.log('\n=== User Admin Status ===\n')
        users.forEach(user => {
            console.log(`Name: ${user.name}`)
            console.log(`Email: ${user.email}`)
            console.log(`isAdmin: ${user.isAdmin}`)
            console.log(`accountType: ${user.accountType}`)
            console.log(`Is Admin? ${user.isAdmin || user.accountType === 'ADMIN' ? 'YES' : 'NO'}`)
            console.log('---')
        })

        console.log(`\nTotal users: ${users.length}`)
        const adminCount = users.filter(u => u.isAdmin || u.accountType === 'ADMIN').length
        console.log(`Admin users: ${adminCount}\n`)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkAdmin()
