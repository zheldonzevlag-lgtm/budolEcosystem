const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@budolpay.com' },
    update: {},
    create: {
      email: 'admin@budolpay.com',
      phoneNumber: '09170000000',
      passwordHash: hashedPassword,
      firstName: 'Budol',
      lastName: 'Admin',
      role: 'ADMIN',
      kycStatus: 'VERIFIED',
    },
  });

  console.log('Admin user created:', admin.email);

  // Initial Settings
  const initialSettings = [
    {
      key: 'AUTH_SERVICE_URL',
      value: 'http://localhost:8001',
      description: 'Internal endpoint for Auth microservice',
      isSecret: false,
    },
    {
      key: 'WALLET_SERVICE_URL',
      value: 'http://localhost:8002',
      description: 'Internal endpoint for Wallet microservice',
      isSecret: false,
    },
    {
      key: 'TRANSACTION_SERVICE_URL',
      value: 'http://localhost:8003',
      description: 'Internal endpoint for Transaction microservice',
      isSecret: false,
    },
    {
      key: 'ACTIVE_PAYMENT_PROVIDER',
      value: 'paymongo',
      description: 'Active gateway (paymongo, xendit, dragonpay, internal)',
      isSecret: false,
    },
    {
      key: 'PAYMONGO_SECRET_KEY',
      value: 'sk_test_placeholder',
      description: 'PayMongo API Secret Key',
      isSecret: true,
    },
    {
      key: 'XENDIT_SECRET_KEY',
      value: 'xnd_test_placeholder',
      description: 'Xendit API Secret Key',
      isSecret: true,
    },
    {
      key: 'DRAGONPAY_MERCHANT_ID',
      value: 'example_id',
      description: 'Dragonpay Merchant ID',
      isSecret: false,
    },
  ];

  for (const setting of initialSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('Initial system settings seeded.');

  // SSO Ecosystem Apps
  const apps = [
    { name: 'budolPay', apiKey: 'bp_key_2025', redirectUri: 'http://localhost:3000/auth/callback' },
    { name: 'budolShap', apiKey: 'bs_key_2025', redirectUri: 'http://localhost:3001/auth/callback' },
    { name: 'budolExpress', apiKey: 'be_key_2025', redirectUri: 'http://localhost:3002/auth/callback' },
  ];

  for (const app of apps) {
    await prisma.ecosystemApp.upsert({
      where: { name: app.name },
      update: { redirectUri: app.redirectUri },
      create: app,
    });
  }

  console.log('Ecosystem SSO apps seeded.');

  // Chart of Accounts
  const chartOfAccounts = [
    { code: '1000', name: 'Cash at Bank', type: 'ASSET', description: 'Main operating bank account' },
    { code: '1010', name: 'User Wallet Balances', type: 'LIABILITY', description: 'Total funds held for users' },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', description: 'Pending payouts to merchants/partners' },
    { code: '3000', name: 'Retained Earnings', type: 'EQUITY', description: 'Accumulated profits' },
    { code: '4000', name: 'Transaction Fees Revenue', type: 'REVENUE', description: 'Revenue from processing fees' },
    { code: '5000', name: 'Bank Charges', type: 'EXPENSE', description: 'Fees charged by payment providers/banks' },
  ];

  for (const account of chartOfAccounts) {
    await prisma.chartOfAccount.upsert({
      where: { code: account.code },
      update: { name: account.name, type: account.type, description: account.description },
      create: account,
    });
  }

  console.log('Chart of Accounts seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
