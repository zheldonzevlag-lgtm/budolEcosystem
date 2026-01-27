const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public"
    },
  },
});

const JWT_SECRET = 'budolid-super-secret-key';

async function setupShapUser() {
  const email = 'clark.kent@budolshap.com';
  const password = 'asakapa';
  
  console.log(`Setting up budolShap user: ${email}`);
  
  try {
    let user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('User not found in budolShap. Creating...');
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          id: 'clark-kent-id-001',
          email,
          password: hashedPassword,
          name: 'Clark Kent',
          phoneNumber: '09123456789',
          image: 'https://ui-avatars.com/api/?name=Clark+Kent',
          accountType: 'BUYER'
        }
      });
      console.log('User created in budolShap.');
    } else {
      console.log('User exists in budolShap.');
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('--- budolShap User Status ---');
    console.log(`ID: ${user.id}`);
    console.log(`Token: ${token}`);
    
    // Find a product
    const product = await prisma.product.findFirst({
      where: { status: 'PUBLISHED' }
    });
    
    if (product) {
      console.log(`Found product: ${product.name} (ID: ${product.id}, Price: ${product.price})`);
      console.log(`Product ID: ${product.id}`);
    } else {
      console.log('No published products found.');
    }
    console.log('----------------------------');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupShapUser();
