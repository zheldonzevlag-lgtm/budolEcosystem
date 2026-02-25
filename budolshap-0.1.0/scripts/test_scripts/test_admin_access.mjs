import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

async function testAdminAccess() {
    const email = 'reynaldomgalvez@gmail.com'
    console.log(`\n--- Testing Admin Access for ${email} ---`)

    // 1. Check user in database
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            accountType: true,
            isAdmin: true,
            role: true
        }
    })

    if (!user) {
        console.error('User not found in database.')
        return
    }

    console.log('Database Record:', JSON.stringify(user, null, 2))

    // 2. Verify admin logic (simulating isUserAdmin from lib/adminAccess.js)
    const isAdmin = user.isAdmin === true || user.accountType === 'ADMIN'
    console.log(`Admin Logic Check: ${isAdmin ? 'PASSED' : 'FAILED'}`)

    // 3. Simulate JWT generation (what the auth system does)
    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, accountType: user.accountType },
        process.env.JWT_SECRET || 'your-secret-key', // Use fallback for simulation if not in env
        { expiresIn: '7d' }
    )
    console.log(`Generated Token (simulated): ${token.substring(0, 20)}...`)

    // 4. Verify token (simulating verifyToken from lib/token.js)
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
        console.log('Token Verification: PASSED')
        console.log('Decoded Payload:', JSON.stringify(decoded, null, 2))
    } catch (err) {
        console.error('Token Verification: FAILED', err.message)
    }

    console.log('\n--- Admin Access Test Complete ---')
}

testAdminAccess()
    .catch(err => {
        console.error('Test failed:', err)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
