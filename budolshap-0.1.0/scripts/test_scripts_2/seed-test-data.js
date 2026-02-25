/**
 * Script to seed test data for development
 * 
 * Usage: node scripts/seed-test-data.js
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env file manually if it exists
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
} catch (error) {
    // .env file not found or couldn't be read, that's okay
}

const prisma = new PrismaClient({
    log: ['error', 'warn']
})

async function seedTestData() {
    try {
        console.log('🌱 Seeding test data...\n')

        // Create admin user
        console.log('Creating admin user...')
        const hashedPassword = await bcrypt.hash('admin123', 10)
        const adminId = 'admin_' + Date.now()

        const admin = await prisma.user.upsert({
            where: { email: 'admin@budolshap.com' },
            update: {},
            create: {
                id: adminId,
                name: 'Admin User',
                email: 'admin@budolshap.com',
                password: hashedPassword,
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                accountType: 'ADMIN',
                emailVerified: true,
                phoneNumber: '09123456789'
            }
        })
        console.log('✅ Admin created:', admin.email)

        // Create seller user
        console.log('\nCreating seller user...')
        const sellerId = 'seller_' + Date.now()
        const seller = await prisma.user.upsert({
            where: { email: 'seller@budolshap.com' },
            update: {},
            create: {
                id: sellerId,
                name: 'Jon Galvez',
                email: 'seller@budolshap.com',
                password: hashedPassword,
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller',
                accountType: 'SELLER',
                emailVerified: true,
                phoneNumber: '09123456788'
            }
        })
        console.log('✅ Seller created:', seller.email)

        // Create store
        console.log('\nCreating store...')
        const store = await prisma.store.upsert({
            where: { userId: seller.id },
            update: {},
            create: {
                userId: seller.id,
                name: 'Jon\'s Shop',
                username: 'jonsshop',
                description: 'Quality products at great prices',
                email: 'store@budolshap.com',
                contact: '+639123456789',
                address: 'Manila, Philippines',
                logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=jonsshop',
                status: 'approved',
                isActive: true,
                verificationStatus: 'APPROVED'
            }
        })
        console.log('✅ Store created:', store.name)

        // Create wallet for store
        console.log('\nCreating wallet...')
        const wallet = await prisma.wallet.upsert({
            where: { storeId: store.id },
            update: {},
            create: {
                storeId: store.id,
                balance: 0
            }
        })
        console.log('✅ Wallet created')

        // Create buyer users
        console.log('\nCreating buyer users...')
        const buyers = []
        const buyerNames = ['Natasha Romanoff', 'Keonna Galvez', 'Carper Milan', 'Alfred Zevlag']

        for (let i = 0; i < buyerNames.length; i++) {
            const buyerId = 'buyer_' + Date.now() + '_' + i
            const buyer = await prisma.user.upsert({
                where: { email: `buyer${i + 1}@test.com` },
                update: {},
                create: {
                    id: buyerId,
                    name: buyerNames[i],
                    email: `buyer${i + 1}@test.com`,
                    password: hashedPassword,
                    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=buyer${i}`,
                    accountType: 'BUYER',
                    emailVerified: true,
                    phoneNumber: `0912345678${i}`
                }
            })
            buyers.push(buyer)
            console.log(`✅ Buyer created: ${buyer.email}`)
        }

        // Create products
        console.log('\nCreating products...')
        const products = []
        const productData = [
            { name: 'Wireless Headphones', category: 'Electronics', mrp: 2000, price: 1500, description: 'High-quality wireless headphones' },
            { name: 'Smart Watch', category: 'Electronics', mrp: 5000, price: 3500, description: 'Feature-rich smartwatch' },
            { name: 'Laptop Stand', category: 'Accessories', mrp: 800, price: 600, description: 'Ergonomic laptop stand' },
            { name: 'USB-C Cable', category: 'Accessories', mrp: 300, price: 200, description: 'Fast charging USB-C cable' },
            { name: 'Phone Case', category: 'Accessories', mrp: 500, price: 350, description: 'Protective phone case' }
        ]

        for (const data of productData) {
            const product = await prisma.product.create({
                data: {
                    ...data,
                    storeId: store.id,
                    images: ['https://via.placeholder.com/400'],
                    inStock: true
                }
            })
            products.push(product)
            console.log(`✅ Product created: ${product.name}`)
        }


        // Create addresses for buyers with real Philippine barangays
        console.log('\nCreating addresses...');
        const addresses = [];
        const realAddresses = [
            {
                street: 'Leviste Street',
                houseNumber: '123',
                barangay: 'Bel-Air',
                city: 'Makati',
                state: 'NCR - National Capital Region',
                zip: '1209',
                landmark: 'Salcedo Village'
            },
            {
                street: 'Ayala Avenue',
                houseNumber: '6750',
                barangay: 'Poblacion',
                city: 'Makati',
                state: 'NCR - National Capital Region',
                zip: '1226',
                landmark: 'Near Glorietta Mall'
            },
            {
                street: '26th Street',
                houseNumber: '8th Avenue',
                barangay: 'Fort Bonifacio',
                city: 'Taguig',
                state: 'NCR - National Capital Region',
                zip: '1634',
                landmark: 'BGC High Street'
            },
            {
                street: 'Roxas Boulevard',
                houseNumber: '1234',
                barangay: 'Malate',
                city: 'Manila',
                state: 'NCR - National Capital Region',
                zip: '1004',
                landmark: 'Near Manila Bay'
            }
        ];

        for (let i = 0; i < buyers.length; i++) {
            const buyer = buyers[i];
            const addressData = realAddresses[i];
            const address = await prisma.address.create({
                data: {
                    userId: buyer.id,
                    name: buyer.name,
                    email: buyer.email,
                    street: addressData.street,
                    houseNumber: addressData.houseNumber,
                    barangay: addressData.barangay,
                    city: addressData.city,
                    state: addressData.state,
                    zip: addressData.zip,
                    country: 'Philippines',
                    phone: '+639123456789',
                    landmark: addressData.landmark
                }
            });
            addresses.push(address);
            console.log(`✅ Address created for ${buyer.name}`);
        }

        // Create orders
        console.log('\nCreating orders...')
        const orderStatuses = ['DELIVERED', 'DELIVERED', 'ORDER_PLACED', 'ORDER_PLACED', 'DELIVERED']
        const paymentMethods = ['COD', 'GCASH', 'GCASH', 'GCASH', 'COD']

        for (let i = 0; i < 5; i++) {
            const buyer = buyers[i % buyers.length]
            const address = addresses[i % addresses.length]
            const product = products[i]
            const quantity = Math.floor(Math.random() * 3) + 1
            const total = product.price * quantity

            const order = await prisma.order.create({
                data: {
                    userId: buyer.id,
                    storeId: store.id,
                    addressId: address.id,
                    total: total,
                    shippingCost: 0,
                    status: orderStatuses[i],
                    paymentMethod: paymentMethods[i],
                    isPaid: paymentMethods[i] === 'GCASH',
                    orderItems: {
                        create: {
                            productId: product.id,
                            quantity: quantity,
                            price: product.price
                        }
                    }
                }
            })
            console.log(`✅ Order created: ${order.id} - ${orderStatuses[i]}`)
        }

        console.log('\n✅ Test data seeded successfully!')
        console.log('\n📝 Login credentials:')
        console.log('   Admin: admin@budolshap.com / admin123')
        console.log('   Seller: seller@budolshap.com / admin123')
        console.log('   Buyers: buyer1@test.com, buyer2@test.com, buyer3@test.com / admin123')
        console.log('')

    } catch (error) {
        console.error('❌ Error seeding data:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

seedTestData()
