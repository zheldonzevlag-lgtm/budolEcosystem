const { PrismaClient } = require('@prisma/client');

async function findPeterParker() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:r00t@localhost:5432/budolpay?schema=public"
      }
    }
  });

  try {
    console.log('--- Searching for Peter Parker (Balance: 120,102.00) ---');
    
    const wallets = await prisma.wallet.findMany({
      where: {
        balance: 120102.00
      },
      include: {
        user: true
      }
    });

    if (wallets.length > 0) {
      console.log(`Found ${wallets.length} wallet(s) with balance 120,102.00:`);
      wallets.forEach(w => {
        console.log(`User ID: ${w.userId}`);
        if (w.user) {
          console.log(`Name: ${w.user.firstName} ${w.user.lastName}`);
          console.log(`Phone: ${w.user.phoneNumber}`);
          console.log(`Email: ${w.user.email}`);
        } else {
          console.log('No associated user found in current DB.');
        }
      });
    } else {
      console.log('No wallet found with balance 120,102.00.');
      
      // Fallback: search by name
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: 'Peter', mode: 'insensitive' } },
            { lastName: { contains: 'Parker', mode: 'insensitive' } }
          ]
        },
        include: {
          wallet: true
        }
      });
      
      console.log(`Found ${users.length} user(s) matching "Peter" or "Parker":`);
      users.forEach(u => {
        console.log(`User: ${u.firstName} ${u.lastName} (${u.phoneNumber})`);
        console.log(`Balance: ${u.wallet ? u.wallet.balance : 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('Error finding Peter Parker:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findPeterParker();
