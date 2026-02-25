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
      where: { inStock: true },
      include: { store: true }
    });
    
    if (product) {
      console.log(`Found product: ${product.name} (ID: ${product.id}, Price: ${product.price})`);
      console.log(`Store ID: ${product.storeId}`);
      
      // Find an address for the user
      let address = await prisma.address.findFirst({
        where: { userId: user.id }
      });
      
      if (!address) {
        console.log('No address found for user. Creating one...');
        address = await prisma.address.create({
          data: {
            userId: user.id,
            name: 'Home',
            street: '123 Main St',
            barangay: 'San Lorenzo',
            city: 'Metropolis',
            state: 'New York',
            zip: '10001',
            country: 'PH',
            phone: '09123456789',
            email: user.email
          }
        });
      }
      
      console.log(`Address ID: ${address.id}`);
    } else {
      console.log('No products found.');
    }
    console.log('----------------------------');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupShapUser();
