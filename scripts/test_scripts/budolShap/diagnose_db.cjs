
const path = require('path');
// Explicitly require from the local node_modules
const { PrismaClient } = require(path.join(process.cwd(), 'node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function diagnose() {
  console.log('--- Database Diagnosis ---');
  console.log('Current Working Directory:', process.cwd());
  console.log('Available models:', Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')));
  
  try {
    // Check Users
    if (prisma.user) {
        const userCount = await prisma.user.count();
        console.log(`Total Users: ${userCount}`);
        
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            accountType: true,
            isAdmin: true
          }
        });
        console.log('Users in DB:');
        users.forEach(u => console.log(`- ${u.name} (${u.email}): accountType=${u.accountType}, isAdmin=${u.isAdmin}`));
    } else {
        console.log('User model not found on prisma object');
    }

    // Check Products
    if (prisma.product) {
        const productCount = await prisma.product.count();
        console.log(`Total Products: ${productCount}`);
        
        const products = await prisma.product.findMany({
          take: 5,
          select: {
            id: true,
            name: true,
            inStock: true,
            storeId: true
          }
        });
        console.log('Products in DB (first 5):');
        products.forEach(p => console.log(`- ${p.name}: inStock=${p.inStock}, storeId=${p.storeId}`));
    } else {
        console.log('Product model not found on prisma object');
    }

    // Check Stores
    if (prisma.store) {
        const storeCount = await prisma.store.count();
        console.log(`Total Stores: ${storeCount}`);
        
        const stores = await prisma.store.findMany({
          select: {
            id: true,
            name: true,
            status: true,
            isActive: true
          }
        });
        console.log('Stores in DB:');
        stores.forEach(s => console.log(`- ${s.name}: status=${s.status}, isActive=${s.isActive}`));
    } else {
        console.log('Store model not found on prisma object');
    }

  } catch (error) {
    console.error('Diagnosis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
