const path = require('path');
const { prisma } = require(path.resolve(__dirname, 'budolpay-0.1.0', 'packages', 'database', 'index.js'));
const axiosModule = require(path.resolve(__dirname, 'budolpay-0.1.0', 'node_modules', 'axios'));
const axios = axiosModule.default || axiosModule;
require('dotenv').config();

// We need to require the Prisma client for budolShap
const shapPrismaPath = path.resolve(__dirname, 'budolshap-0.1.0', 'node_modules', '@prisma/client');
const { PrismaClient: ShapPrismaClient } = require(shapPrismaPath);

// Ensure we use the correct database URLs for both systems
process.env.DATABASE_URL = "postgresql://postgres:r00t@localhost:5432/budolpay_db?schema=public";
const SHAP_DATABASE_URL = "postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public";

async function simulateMobileScan() {
  const referenceId = 'INTENT-1767383910911'; // The referenceId from the checkout response
  const userEmail = 'clark.kent@budolshap.com';
  
  console.log(`Simulating Mobile Scan for: ${referenceId}`);
  
  try {
    // 1. Find the transaction in budolPay
    const transaction = await prisma.transaction.findUnique({
      where: { referenceId }
    });
    
    if (!transaction) {
      console.error('Transaction not found!');
      return;
    }
    
    console.log(`Found Transaction: ${transaction.id} (${transaction.status})`);
    
    // 2. Find the user (Clark Kent) in budolPay to subtract balance
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { wallet: true }
    });
    
    if (!user || !user.wallet) {
      console.error('User or Wallet not found!');
      return;
    }
    
    console.log(`User Balance: ${user.wallet.balance} PHP`);
    
    if (parseFloat(user.wallet.balance) < parseFloat(transaction.amount)) {
      console.error('Insufficient funds in wallet!');
      return;
    }
    
    // 3. Simulate the mobile app confirming the payment
    console.log('Processing payment confirmation...');
    
    // Subtract from wallet
    const newBalance = parseFloat(user.wallet.balance) - parseFloat(transaction.amount);
    await prisma.wallet.update({
      where: { userId: user.id },
      data: { balance: newBalance }
    });
    
    // Update transaction to include userId
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { 
        sender: { connect: { id: user.id } }
      }
    });
    
    // 4. Trigger the webhook via the gateway's internal logic (simulated by calling its webhook endpoint)
    // In our case, we'll call the gateway's internal completion logic via its public webhook endpoint
    // with a mock provider payload that matches our transaction
    console.log('Sending completion webhook...');
    const gatewayWebhookUrl = 'http://localhost:8004/webhooks/internal';
    const payload = {
      referenceId: referenceId,
      amount: transaction.amount,
      status: 'paid'
    };
    
    const response = await axios.post(gatewayWebhookUrl, payload);
    console.log('Gateway Webhook Response:', response.data);
    
    // 5. Verify the order in budolShap
    console.log('\nVerifying order status in budolShap...');
    const shapPrisma = new ShapPrismaClient({
      datasources: {
        db: {
          url: SHAP_DATABASE_URL
        },
      },
    });
    
    const metadata = JSON.parse(transaction.metadata || '{}');
    const orderId = metadata.orderId || (transaction.description.match(/Order #([a-z0-9]+)/) || [])[1];
    
    if (!orderId) {
      console.error('Order ID not found in transaction metadata or description!');
      return;
    }
    
    const order = await shapPrisma.order.findUnique({
      where: { id: orderId }
    });
    
    console.log('--- Final Order Status ---');
    console.log(`Order ID: ${orderId}`);
    console.log(`Status: ${order ? order.status : 'NOT FOUND'}`);
    console.log(`Is Paid: ${order ? order.isPaid : 'N/A'}`);
    console.log(`Payment Status: ${order ? order.paymentStatus : 'N/A'}`);
    console.log('--------------------------');
    
    if (order && order.isPaid) {
      console.log('✅ TEST SUCCESSFUL: Order marked as paid in budolShap!');
    } else {
      console.log('❌ TEST FAILED: Order status not updated yet.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Simulation Error:', error);
    process.exit(1);
  }
}

simulateMobileScan();
