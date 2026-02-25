
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@budolshap.com'
    const password = 'tr@1t0r'
    const name = 'Admin User'

    console.log(`Checking if user ${email} exists...`)

    const existingUser = await prisma.user.findUnique({
        where: { email },
    })

    if (existingUser) {
        console.log(`User ${email} already exists. Updating to ensure admin status...`)
        await prisma.user.update({
            where: { email },
            data: {
                accountType: 'ADMIN',
                isAdmin: true,
                isMember: true, // Assuming admin gets benefits
                emailVerified: true,
            },
        })
        console.log('User updated.')
    } else {
        console.log(`Creating new admin user ${email}...`)
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Generate ID similar to registration route
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)

        await prisma.user.create({
            data: {
                id: userId,
                name,
                email,
                password: hashedPassword,
                accountType: 'ADMIN',
                isAdmin: true,
                emailVerified: true,
                image: '',
                cart: {}, // Default empty cart
            },
        })
        console.log('Admin user created successfully.')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
