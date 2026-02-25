
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding "Rich" Data (Marvel/DC Theme)...');

    const password = await bcrypt.hash('admin123', 10);

    // Helper
    async function upsertUser({ email, name, role, storeName }) {
        console.log(`   Processing ${name}...`);
        const id = 'user_' + name.toLowerCase().replace(' ', '_');

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                accountType: role,
                isAdmin: role === 'ADMIN',
                name: name
            },
            create: {
                id,
                email,
                name,
                password,
                accountType: role,
                isAdmin: role === 'ADMIN',
                emailVerified: true,
                image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(' ', '')}`
            }
        });

        if (role === 'SELLER' && storeName) {
            const store = await prisma.store.upsert({
                where: { userId: user.id },
                update: { name: storeName },
                create: {
                    userId: user.id,
                    name: storeName,
                    username: storeName.toLowerCase().replace(' ', '_'),
                    description: `${storeName} Official Store`,
                    address: 'New York, USA',
                    email: email,
                    contact: '1234567890',
                    logo: '',
                    status: 'approved',
                    isActive: true,
                    verificationStatus: 'APPROVED'
                }
            });
            console.log(`      Store created: ${store.name}`);
        }
    }

    // 1. Jon Galvez (Buyer)
    await upsertUser({ email: 'jon.galvez@budolshap.com', name: 'Jon Galvez', role: 'BUYER' });

    // 2. Stephen Strange (Buyer)
    await upsertUser({ email: 'stephen.strange@budolshap.com', name: 'Stephen Strange', role: 'BUYER' });

    // 3. Tony Stark (Seller)
    await upsertUser({ email: 'tony.stark@budolshap.com', name: 'Tony Stark', role: 'SELLER', storeName: 'Stark Industries' });

    // 4. Bruce Wayne (Seller)
    await upsertUser({ email: 'bruce.wayne@budolshap.com', name: 'Bruce Wayne', role: 'SELLER', storeName: 'Wayne Enterprises' });

    // 5. Admin User (Admin) - Already exists, but ensure it matches
    await upsertUser({ email: 'admin@budolshap.com', name: 'Admin User', role: 'ADMIN' });

    console.log('\n✅ Local Database populated with Screenshot Data!');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
