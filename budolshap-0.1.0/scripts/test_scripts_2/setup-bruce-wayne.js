/**
 * Setup Test User: bruce.wayne@budolshap.com
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const envPath = path.join(__dirname, '..', '.env.production')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/)
const DATABASE_URL = dbUrlMatch[1].replace(/\n/g, '')

const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
})

async function setupUser() {
    console.log('🦇 Setting up Bruce Wayne...\n')

    const email = 'bruce.wayne@budolshap.com'
    const password = 'budolshap'
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        // 1. Check if user exists
        let user = await prisma.user.findUnique({
            where: { email }
        })

        if (user) {
            console.log('✅ User already exists:', user.id)
            // Update password just in case
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            })
            console.log('   Password updated to "budolshap"')
        } else {
            console.log('🆕 Creating new user...')
            user = await prisma.user.create({
                data: {
                    id: 'user_bruce_wayne', // Custom ID for easy finding
                    name: 'Bruce Wayne',
                    email: email,
                    password: hashedPassword,
                    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bruce',
                    accountType: 'BUYER',
                    emailVerified: true
                }
            })
            console.log('✅ User created:', user.id)
        }

        // 2. Check/Create Address
        const address = await prisma.address.findFirst({
            where: { userId: user.id }
        })

        if (address) {
            console.log('✅ Address exists:', address.city)
        } else {
            console.log('🆕 Creating address (Wayne Manor)...')
            await prisma.address.create({
                data: {
                    userId: user.id,
                    name: 'Bruce Wayne',
                    email: email,
                    phone: '09171234567',
                    street: '1007 Mountain Drive',
                    barangay: 'Gotham',
                    city: 'Makati City',
                    state: 'Metro Manila',
                    zip: '1200',
                    country: 'Philippines',
                    latitude: 14.5547,
                    longitude: 121.0244
                }
            })
            console.log('✅ Address created')
        }

        console.log('\n🦇 Bruce Wayne is ready for action!')

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

setupUser()
