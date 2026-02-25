const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminAndStores() {
    try {
        console.log('🔍 Checking admin user and pending stores...\n');

        // Check for admin user
        const adminUser = await prisma.user.findUnique({
            where: { email: 'admin@budolshap.com' }
        });

        if (adminUser) {
            console.log('✅ Admin user found:');
            console.log(`   Email: ${adminUser.email}`);
            console.log(`   Name: ${adminUser.name}`);
            console.log(`   Role: ${adminUser.role}`);
            console.log(`   ID: ${adminUser.id}\n`);
        } else {
            console.log('❌ Admin user NOT found!\n');
        }

        // Check for John Wick user
        const johnUser = await prisma.user.findUnique({
            where: { email: 'john.wick@budolshap.com' }
        });

        if (johnUser) {
            console.log('✅ John Wick user found:');
            console.log(`   Email: ${johnUser.email}`);
            console.log(`   Name: ${johnUser.name}`);
            console.log(`   Role: ${johnUser.role}`);
            console.log(`   ID: ${johnUser.id}\n`);
        } else {
            console.log('❌ John Wick user NOT found!\n');
        }

        // Check for pending stores
        const pendingStores = await prisma.store.findMany({
            where: { status: 'PENDING' },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true
                    }
                }
            }
        });

        console.log(`📋 Pending stores: ${pendingStores.length}\n`);

        if (pendingStores.length > 0) {
            pendingStores.forEach((store, index) => {
                console.log(`Store ${index + 1}:`);
                console.log(`   Store Name: ${store.name}`);
                console.log(`   Description: ${store.description}`);
                console.log(`   Owner: ${store.user.name} (${store.user.email})`);
                console.log(`   Status: ${store.status}`);
                console.log(`   Created: ${store.createdAt}`);
                console.log('');
            });
        } else {
            console.log('⚠️  No pending stores found!\n');
        }

        // Check all stores
        const allStores = await prisma.store.findMany({
            include: {
                user: {
                    select: {
                        email: true,
                        name: true
                    }
                }
            }
        });

        console.log(`📊 Total stores in database: ${allStores.length}\n`);

        if (allStores.length > 0) {
            allStores.forEach((store, index) => {
                console.log(`Store ${index + 1}:`);
                console.log(`   Store Name: ${store.name}`);
                console.log(`   Owner: ${store.user.name} (${store.user.email})`);
                console.log(`   Status: ${store.status}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminAndStores();
