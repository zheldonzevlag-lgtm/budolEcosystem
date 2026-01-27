
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from budolshap-0.1.0 - absolute path is safer
const envPath = path.resolve(__dirname, '../../../../budolshap-0.1.0/.env');
dotenv.config({ path: envPath });

// Import PrismaClient from the specific workspace
const prismaClientPath = path.resolve(__dirname, '../../../../budolshap-0.1.0/node_modules/@prisma/client/index.js');
const { PrismaClient } = require(prismaClientPath);

const prisma = new PrismaClient({
    log: ['error'],
});

async function fixPaidOrders() {
  console.log('--- Fixing Paid Orders with "awaiting_payment" status ---');
  
  try {
    const ordersToFix = await prisma.order.findMany({
      where: {
        isPaid: true,
        paymentStatus: 'awaiting_payment'
      }
    });

    console.log(`Found ${ordersToFix.length} orders to fix.`);

    for (const order of ordersToFix) {
      console.log(`Updating Order ${order.id}...`);
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid'
        }
      });
    }

    console.log('✅ All paid orders updated successfully.');
  } catch (error) {
    console.error('❌ Error fixing orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPaidOrders();
