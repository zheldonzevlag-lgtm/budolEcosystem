require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function exportData() {
    const prisma = new PrismaClient();

    try {
        console.log('🔄 Exporting data from current database...\n');

        // Export Users
        console.log('📤 Exporting users...');
        const users = await prisma.user.findMany();
        fs.writeFileSync('backup-users.json', JSON.stringify(users, null, 2));
        console.log(`✅ Exported ${users.length} users`);

        // Export Stores
        console.log('📤 Exporting stores...');
        const stores = await prisma.store.findMany();
        fs.writeFileSync('backup-stores.json', JSON.stringify(stores, null, 2));
        console.log(`✅ Exported ${stores.length} stores`);

        // Export Products
        console.log('📤 Exporting products...');
        const products = await prisma.product.findMany();
        fs.writeFileSync('backup-products.json', JSON.stringify(products, null, 2));
        console.log(`✅ Exported ${products.length} products`);

        // Export Orders
        console.log('📤 Exporting orders...');
        const orders = await prisma.order.findMany();
        fs.writeFileSync('backup-orders.json', JSON.stringify(orders, null, 2));
        console.log(`✅ Exported ${orders.length} orders`);

        // Export Categories
        console.log('📤 Exporting categories...');
        const categories = await prisma.category.findMany();
        fs.writeFileSync('backup-categories.json', JSON.stringify(categories, null, 2));
        console.log(`✅ Exported ${categories.length} categories`);

        // Export Addresses
        console.log('📤 Exporting addresses...');
        const addresses = await prisma.address.findMany();
        fs.writeFileSync('backup-addresses.json', JSON.stringify(addresses, null, 2));
        console.log(`✅ Exported ${addresses.length} addresses`);

        console.log('\n✅ Data export complete!');
        console.log('\nBackup files created:');
        console.log('- backup-users.json');
        console.log('- backup-stores.json');
        console.log('- backup-products.json');
        console.log('- backup-orders.json');
        console.log('- backup-categories.json');
        console.log('- backup-addresses.json');

    } catch (error) {
        console.error('❌ Error exporting data:', error.message);
        console.error('\nIf you get connection errors, the database might already be fully suspended.');
        console.error('In that case, you may need to contact Vercel support to temporarily reactivate it for export.');
    } finally {
        await prisma.$disconnect();
    }
}

exportData();
