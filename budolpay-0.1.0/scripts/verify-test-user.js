const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:r00t@localhost:5432/budolpay_db?schema=public"
    },
  },
});

async function checkUser() {
  const email = 'clark.kent@budolshap.com';
  const password = 'asakapa';
  
  console.log(`Checking user: ${email}`);
  
  try {
    let user = await prisma.user.findUnique({
      where: { email },
      include: { wallet: true }
    });
    
    if (!user) {
      console.log('User not found in budolPay. Creating...');
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          phoneNumber: '09123456789',
          firstName: 'Clark',
          lastName: 'Kent',
          role: 'USER',
          kycStatus: 'VERIFIED',
          wallet: {
            create: {
              balance: 50000.00, // 50k PHP for testing
              currency: 'PHP'
            }
          }
        },
        include: { wallet: true }
      });
      console.log('User created successfully.');
    } else {
      console.log('User exists.');
      // Ensure password matches for the test
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        console.log('Updating password to "asakapa"...');
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: hashedPassword }
        });
      }
      
      // Ensure wallet has balance
      if (!user.wallet || parseFloat(user.wallet.balance) < 1000) {
        console.log('Topping up wallet balance...');
        await prisma.wallet.upsert({
          where: { userId: user.id },
          update: { balance: 50000.00 },
          create: { userId: user.id, balance: 50000.00, currency: 'PHP' }
        });
      }
    }
    
    const finalUser = await prisma.user.findUnique({
      where: { email },
      include: { wallet: true }
    });
    
    console.log('--- User Status ---');
    console.log(`ID: ${finalUser.id}`);
    console.log(`Email: ${finalUser.email}`);
    console.log(`Balance: ${finalUser.wallet.balance} ${finalUser.wallet.currency}`);
    console.log('-------------------');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
