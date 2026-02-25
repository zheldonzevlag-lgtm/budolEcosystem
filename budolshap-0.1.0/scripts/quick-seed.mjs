// Quick seed script to restore basic data after database reset
// Run with: node scripts/quick-seed.mjs

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting quick seed...');

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'peter@test.com' },
        update: {},
        create: {
            id: '58309e63-49d2-448a-a8e0-750233c8d591', // Use existing ID if you know it
            name: 'Peter Parker',
            email: 'peter@test.com',
            password: hashedPassword,
            phoneNumber: '+639123456789',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Peter',
            accountType: 'ADMIN',
            isAdmin: true,
            role: 'ADMIN',
            emailVerified: true
        }
    });
    console.log('✅ User created:', user.email);

    // Create store
    const store = await prisma.store.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            name: 'Online Micro Sellers Multipurpose Cooperative',
            username: 'omsmpc',
            description: 'Test store',
            address: 'San Juan, Eastern Manila District, 1008, Philippines',
            email: 'store@test.com',
            contact: '+639123456789',
            logo: '/store-logo.png',
            status: 'approved',
            isActive: true
        }
    });
    console.log('✅ Store created:', store.name);

    // Create cart for user
    await prisma.cart.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id
        }
    });
    console.log('✅ Cart created for user');

    // Create product with variations
    const product = await prisma.product.create({
        data: {
            name: 'budolShap Boxing Gloves',
            description: 'Professional boxing gloves',
            mrp: 2000,
            price: 1,
            category: 'Sports & Outdoors',
            storeId: store.id,
            images: ['https://example.com/green-gloves.jpg'],
            tier_variations: [
                {
                    name: 'Color',
                    options: ['Green', 'Blue', 'Red']
                }
            ],
            variation_matrix: [
                {
                    sku: 'Green',
                    tier_index: [0],
                    price: 1,
                    mrp: 2000,
                    stock: 10,
                    image: 'https://example.com/green-gloves.jpg'
                },
                {
                    sku: 'Blue',
                    tier_index: [1],
                    price: 1674,
                    mrp: 2000,
                    stock: 10,
                    image: 'https://example.com/blue-gloves.jpg'
                },
                {
                    sku: 'Red',
                    tier_index: [2],
                    price: 1500,
                    mrp: 2000,
                    stock: 10,
                    image: 'https://example.com/red-gloves.jpg'
                }
            ]
        }
    });
    console.log('✅ Product created:', product.name);

    console.log('\n✅ Quick seed completed!');
    console.log('\nLogin credentials:');
    console.log('Email: peter@test.com');
    console.log('Password: password123');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
