const path = require('path');
const { PrismaClient: PrismaPay } = require(path.resolve(__dirname, 'budolpay-0.1.0', 'node_modules', '@prisma/client'));
const { PrismaClient: PrismaShap } = require(path.resolve(__dirname, 'budolshap-0.1.0', 'node_modules', '@prisma/client'));

async function main() {
  const email = 'galvezjon59@gmail.com';
  
  const prismaPay = new PrismaPay({
    datasources: {
      db: {
        url: "postgresql://postgres:r00t@localhost:5432/budolpay?schema=public"
      }
    }
  });
  
  const prismaShap = new PrismaShap({
    datasources: {
      db: {
        url: "postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public"
      }
    }
  });

  console.log(`Setting ${email} as admin...`);

  try {
    // Update BudolPay
    const userPay = await prismaPay.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });
    console.log('✅ Updated BudolPay User:', {
      id: userPay.id,
      email: userPay.email,
      role: userPay.role
    });
  } catch (error) {
    console.error('❌ Error updating BudolPay:', error.message);
  }

  try {
    // Update BudolShap
    const userShap = await prismaShap.user.update({
      where: { email },
      data: { 
        accountType: 'ADMIN',
        isAdmin: true,
        role: 'ADMIN'
      }
    });
    console.log('✅ Updated BudolShap User:', {
      id: userShap.id,
      email: userShap.email,
      accountType: userShap.accountType,
      isAdmin: userShap.isAdmin,
      role: userShap.role
    });
  } catch (error) {
    console.error('❌ Error updating BudolShap:', error.message);
  }

  await prismaPay.$disconnect();
  await prismaShap.$disconnect();
}

main();
