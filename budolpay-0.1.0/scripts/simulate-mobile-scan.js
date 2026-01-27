const { prisma } = require('./packages/database/index.js');
const axios = require('axios');
const { PrismaClient: ShapPrismaClient } = require('./budolshap-0.1.0/node_modules/@prisma/client');
require('dotenv').config();

// Ensure we use the correct database URLs for both systems
process.env.DATABASE_URL = "postgresql://postgres:r00t@localhost:5432/budolpay_db?schema=public";
const SHAP_DATABASE_URL = "postgresql://postgres:r00t@localhost:5432/budolshap_db?schema=public";

async function simulateMobileScan() {
  const referenceId = 'INTENT-1767383488763'; // The referenceId from the checkout response
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
      data: { userId: user.id }
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
    const orderId = metadata.orderId;
    
    const order = await shapPrisma.order.findUnique({
      where: { id: orderId }
    });
    
    console.log('--- Final Order Status ---');
    console.log(`Order ID: ${order.id}`);
    console.log(`Is Paid: ${order.isPaid}`);
    console.log(`Status: ${order.status}`);
    console.log(`Payment Status: ${order.paymentStatus}`);
    console.log('--------------------------');
    
    await shapPrisma.$disconnect();
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simulateMobileScan();
