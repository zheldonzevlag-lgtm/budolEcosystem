
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const { readFileSync, existsSync } = require('fs')
const { resolve } = require('path')

// Load .env
try {
    const envPath = resolve(process.cwd(), '.env')
    if (existsSync(envPath)) {
        const envFile = readFileSync(envPath, 'utf8')
        envFile.split('\n').forEach(line => {
            const trimmed = line.trim()
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=')
                if (key && valueParts.length) {
                    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
                    if (!process.env[key.trim()]) {
                        process.env[key.trim()] = value
                    }
                }
            }
        })
    }
} catch (error) { }

// Check DB Connection
console.log('Checking Database connection...')
if (process.env.DATABASE_URL) {
    if (process.env.DATABASE_URL.includes('vercel-storage.com') || process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('aws')) {
        console.log('🌍 Detected REMOTE Database URL')
    } else if (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')) {
        console.log('🏠 Detected LOCAL Database URL')
    } else {
        console.log('❓ Detected Database URL (Unknown Type)')
    }
} else {
    console.log('❌ No DATABASE_URL found')
}

const prisma = new PrismaClient()

async function seed() {
    try {
        // 1. Create Buyer (Steve)
        const buyerEmail = 'steve.rogers@budolshap.com'
        const buyerPass = await bcrypt.hash('password123', 10)

        console.log(`\nCreating Buyer: ${buyerEmail}`)
        const buyer = await prisma.user.upsert({
            where: { email: buyerEmail },
            update: { password: buyerPass, emailVerified: true },
            create: {
                id: 'user_steve',
                name: 'Steve Rogers',
                email: buyerEmail,
                password: buyerPass,
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Steve',
                accountType: 'BUYER',
                emailVerified: true
            }
        })
        console.log('✅ Buyer created/updated')

        // 1.1 Buyer Address
        const buyerAddress = await prisma.address.create({
            data: {
                userId: buyer.id,
                name: 'Steve Rogers',
                email: buyerEmail,
                phone: '09171234567',
                street: '123 Avengers Tower',
                barangay: 'Bel-Air',
                city: 'Makati City',
                state: 'Metro Manila',
                zip: '1209',
                country: 'Philippines',
                latitude: 14.5547,
                longitude: 121.0244
            }
        })
        console.log('✅ Buyer Address created')

        // 2. Create Seller (Bruce)
        const sellerEmail = 'bruce.wayne@budolshap.com'
        const sellerPass = await bcrypt.hash('password123', 10) // Matches browser attempt

        console.log(`\nCreating Seller: ${sellerEmail}`)
        const seller = await prisma.user.upsert({
            where: { email: sellerEmail },
            update: { password: sellerPass, emailVerified: true, accountType: 'SELLER' },
            create: {
                id: 'user_bruce',
                name: 'Bruce Wayne',
                email: sellerEmail,
                password: sellerPass,
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bruce',
                accountType: 'SELLER',
                emailVerified: true
            }
        })
        console.log('✅ Seller created/updated')

        // 2.1 Seller Address (Store Location)
        const sellerAddress = await prisma.address.create({
            data: {
                userId: seller.id,
                name: 'Bruce Wayne',
                email: sellerEmail,
                phone: '09181234567',
                street: '1007 Mountain Drive',
                barangay: 'Dasmarinas',
                city: 'Makati City',
                state: 'Metro Manila',
                zip: '1222',
                country: 'Philippines',
                latitude: 14.5350,
                longitude: 121.0330
            }
        })
        console.log('✅ Seller Address created')
        console.log('✅ Seller created/updated')

        // 3. Create Store
        console.log('\nCreating Store: Wayne Enterprises')
        const store = await prisma.store.upsert({
            where: { userId: seller.id },
            update: { status: 'approved', isActive: true },
            create: {
                userId: seller.id,
                name: 'Wayne Enterprises',
                username: 'wayne_ent',
                description: 'Gadgets and tech for the modern hero',
                address: 'Gotham City',
                email: sellerEmail,
                contact: '09170000000',
                logo: 'https://api.dicebear.com/7.x/initials/svg?seed=WE',
                status: 'approved',
                isActive: true
            }
        })
        console.log('✅ Store created/approved')

        // 4. Create Product
        console.log('\nCreating Product: Batarang')
        const product = await prisma.product.upsert({
            where: { id: 'prod_batarang' }, // we can't upsert by ID if it's not unique in schema unless @id, checking schema... User ID is @id, Product ID is @id.
            // But upsert requires a unique constraint. Product ID is primary key, so it works.
            update: {},
            create: {
                id: 'prod_batarang',
                name: 'Tactical Batarang',
                description: 'Aerodynamic throwing weapon. Non-lethal.',
                mrp: 1500,
                price: 1000,
                category: 'Gadgets',
                storeId: store.id,
                images: JSON.stringify(['https://placehold.co/400x400/000000/FFFFFF/png?text=Batarang']),
                inStock: true
            }
        })
        console.log('✅ Product created')

    } catch (e) {
        console.error('❌ Error during seeding:', e)
    } finally {
        await prisma.$disconnect()
    }
}

seed()
