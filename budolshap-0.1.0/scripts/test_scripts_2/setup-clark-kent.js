/**
 * Setup Test Seller: clark.kent@budolshap.com
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

async function setupSeller() {
    console.log('🦸 Setting up Clark Kent (Seller)...\n')

    const email = 'clark.kent@budolshap.com'
    const password = 'budolshap'
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        // 1. Create/Update User
        let user = await prisma.user.findUnique({ where: { email } })

        if (user) {
            console.log('✅ User exists:', user.id)
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    accountType: 'SELLER', // Ensure he is a seller
                    isSeller: true // Legacy field if exists? Schema says accountType is enough but let's check
                    // Schema: accountType AccountType @default(BUYER)
                }
            })
        } else {
            console.log('🆕 Creating new user...')
            user = await prisma.user.create({
                data: {
                    id: 'user_clark_kent',
                    name: 'Clark Kent',
                    email: email,
                    password: hashedPassword,
                    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Clark',
                    accountType: 'SELLER',
                    emailVerified: true
                }
            })
        }

        // 2. Create/Update Store
        let store = await prisma.store.findUnique({ where: { userId: user.id } })

        if (store) {
            console.log('✅ Store exists:', store.name)
        } else {
            console.log('🆕 Creating store (Krypton Store)...')
            store = await prisma.store.create({
                data: {
                    userId: user.id,
                    name: 'Krypton Store',
                    username: 'krypton_store',
                    description: 'Best items from Krypton',
                    address: 'Fortress of Solitude, Arctic',
                    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=KS',
                    email: email,
                    contact: '09181234567',
                    status: 'approved',
                    isActive: true
                }
            })
        }

        // 3. Create Store Address (Required for Lalamove pickup)
        const storeAddress = await prisma.storeAddress.findFirst({ where: { storeId: store.id } })
        if (!storeAddress) {
            console.log('🆕 Creating store pickup address...')
            await prisma.storeAddress.create({
                data: {
                    storeId: store.id,
                    phone: '09181234567',
                    district: 'Metro Manila',
                    city: 'Makati City',
                    barangay: 'San Lorenzo',
                    detailedAddress: 'Greenbelt 5',
                    zip: '1223',
                    isDefault: true,
                    latitude: 14.5520,
                    longitude: 121.0230
                }
            })
        }

        // 4. Create Product
        const product = await prisma.product.findFirst({ where: { storeId: store.id } })

        if (product) {
            console.log('✅ Product exists:', product.name)
        } else {
            console.log('🆕 Creating product (Kryptonite)...')
            await prisma.product.create({
                data: {
                    storeId: store.id,
                    name: 'Green Kryptonite',
                    description: 'Glowing green rock. Handle with lead gloves.',
                    price: 1000,
                    mrp: 1500,
                    category: 'Minerals',
                    images: JSON.stringify(['https://placehold.co/400x400/00ff00/ffffff?text=Kryptonite']),
                    inStock: true
                }
            })
        }

        console.log('\n🦸 Clark Kent is ready for business!')

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

setupSeller()
