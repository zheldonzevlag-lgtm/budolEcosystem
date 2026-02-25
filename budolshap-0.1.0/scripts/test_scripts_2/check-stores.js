require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStores() {
    try {
        console.log('🔍 Checking stores in database...\n');

        const allStores = await prisma.store.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`📊 Total Stores: ${allStores.length}\n`);

        if (allStores.length === 0) {
            console.log('❌ No stores found in database!');
            console.log('\n💡 This means store creation is failing.');
            console.log('   Check the browser console for errors when submitting the form.');
        } else {
            allStores.forEach((store, index) => {
                console.log(`${index + 1}. ${store.name}`);
                console.log(`   Username: ${store.username}`);
                console.log(`   Status: ${store.status}`);
                console.log(`   Active: ${store.isActive}`);
                console.log(`   Owner: ${store.user.name} (${store.user.email})`);
                console.log(`   Created: ${store.createdAt}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkStores();
