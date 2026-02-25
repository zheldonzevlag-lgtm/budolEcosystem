
const path = require('path');
const { PrismaClient } = require(path.join(process.cwd(), 'node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
    const email = 'reynaldomgalvez@gmail.com';
    
    try {
        console.log('--- Fixing Admin and Seeding Data ---');
        
        // 1. Fix User Role
        const user = await prisma.user.findUnique({ where: { email: email } });
        if (user) {
            await prisma.user.update({
                where: { email: email },
                data: {
                    isAdmin: true,
                    accountType: 'ADMIN',
                    role: 'ADMIN'
                }
            });
            console.log(`User ${email} is now an ADMIN.`);
        } else {
            console.log(`User ${email} not found.`);
            return;
        }

        // 2. Create Store
        let store = await prisma.store.findUnique({ where: { userId: user.id } });
        if (!store) {
            store = await prisma.store.create({
                data: {
                    userId: user.id,
                    name: 'Budol Shop Official',
                    username: 'budolshop_official',
                    description: 'The official Budol Shop store.',
                    address: 'Budol Headquarters, Manila',
                    logo: 'https://res.cloudinary.com/dpv07929p/image/upload/v1700000000/budol/logo.png',
                    email: 'official@budolshap.com',
                    contact: '09123456789',
                    status: 'APPROVED',
                    isActive: true
                }
            });
            console.log('Official Store created:', store.id);
        } else {
            console.log('Store already exists:', store.id);
        }

        // 3. Create Products
        const productsData = [
            {
                name: 'Budol Premium Shirt',
                description: 'High-quality cotton shirt with Budol logo.',
                mrp: 599.00,
                price: 499.00,
                images: ['https://via.placeholder.com/400x400?text=Budol+Shirt'],
                category: 'FASHION',
                inStock: true
            },
            {
                name: 'Budol Smart Watch',
                description: 'Stay connected with the latest Budol Smart Watch.',
                mrp: 2999.00,
                price: 2499.00,
                images: ['https://via.placeholder.com/400x400?text=Budol+Watch'],
                category: 'ELECTRONICS',
                inStock: true
            },
            {
                name: 'Budol Wireless Earbuds',
                description: 'Crystal clear sound with long battery life.',
                mrp: 1599.00,
                price: 1299.00,
                images: ['https://via.placeholder.com/400x400?text=Budol+Earbuds'],
                category: 'ELECTRONICS',
                inStock: true
            },
            {
                name: 'Budol Canvas Bag',
                description: 'Eco-friendly and stylish canvas bag.',
                mrp: 399.00,
                price: 299.00,
                images: ['https://via.placeholder.com/400x400?text=Budol+Bag'],
                category: 'FASHION',
                inStock: true
            }
        ];

        for (const p of productsData) {
            const product = await prisma.product.create({
                data: {
                    ...p,
                    storeId: store.id,
                    images: JSON.stringify(p.images)
                }
            });
            console.log(`Product created: ${product.name} (${product.id})`);
        }

        console.log('--- Done ---');

    } catch (error) {
        console.error('Error in fix_admin_and_seed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
