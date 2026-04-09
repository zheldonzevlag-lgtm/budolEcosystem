
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Testing DB connection for BudolShap...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  try {
    const productsCount = await prisma.product.count();
    console.log('Total Products in DB:', productsCount);
    
    const products = await prisma.product.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        inStock: true,
        stock: true,
        price: true
      }
    });
    
    console.log('Sample Products:', JSON.stringify(products, null, 2));
    
  } catch (error) {
    console.error('Error fetching products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
