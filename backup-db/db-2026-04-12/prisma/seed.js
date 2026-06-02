const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'reynaldomgalvez@gmail.com' },
    update: {},
    create: {
      email: 'admin@budolpay.com',
      phoneNumber: '09484099388',
      passwordHash: hashedPassword,
      firstName: 'Jon',
      lastName: 'Galvez',
      role: 'ADMIN',
      kycStatus: 'VERIFIED',
    },
  });

  console.log('Admin user created:', admin.email);

  const localIP = process.env.LOCAL_IP || 'localhost';

  // Initial Settings
  const initialSettings = [
    {
      key: 'AUTH_SERVICE_URL',
      value: `http://${localIP}:8001`,
      group: 'SYSTEM',
    },
    {
      key: 'WALLET_SERVICE_URL',
      value: `http://${localIP}:8002`,
      group: 'SYSTEM',
    },
    {
      key: 'TRANSACTION_SERVICE_URL',
      value: `http://${localIP}:8003`,
      group: 'SYSTEM',
    },
    {
      key: 'ACTIVE_PAYMENT_PROVIDER',
      value: 'paymongo',
      group: 'PAYMENT',
    },
    {
      key: 'PAYMONGO_SECRET_KEY',
      value: 'sk_test_placeholder',
      group: 'PAYMENT',
    },
    {
      key: 'XENDIT_SECRET_KEY',
      value: 'xnd_test_placeholder',
      group: 'PAYMENT',
    },
    {
      key: 'DRAGONPAY_MERCHANT_ID',
      value: 'example_id',
      group: 'PAYMENT',
    },
    {
      key: 'emailProvider',
      value: 'GOOGLE',
      group: 'NOTIFICATION',
    },
    {
      key: 'smsProvider',
      value: 'CONSOLE',
      group: 'NOTIFICATION',
    },
    {
      key: 'smtpHost',
      value: 'smtp.gmail.com',
      group: 'NOTIFICATION',
    },
    {
      key: 'smtpPort',
      value: '587',
      group: 'NOTIFICATION',
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
    { name: 'budolPay', apiKey: 'bp_key_2025', apiSecret: 'bp_secret_2025', redirectUri: `http://${localIP}:3000/auth/callback` },
    { name: 'budolShap', apiKey: 'bs_key_2025', apiSecret: 'bs_secret_2025', redirectUri: `http://${localIP}:3001/auth/callback` },
    { name: 'budolExpress', apiKey: 'be_key_2025', apiSecret: 'be_secret_2025', redirectUri: `http://${localIP}:3002/auth/callback` },
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

  // Additional Test Users for SSO testing
  const testUsers = [
    {
      email: 'test@example.com',
      phoneNumber: '09123456789',
      passwordHash: await bcrypt.hash('password123', 10),
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      kycStatus: 'VERIFIED',
    }
  ];

  for (const user of testUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash: user.passwordHash },
      create: user,
    });
  }

  console.log('Additional test users seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
