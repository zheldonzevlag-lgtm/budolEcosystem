require('dotenv').config();

// Override for testing
process.env.VERCEL = '1';

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const getDatabaseUrl = () => {
    let url = process.env.DATABASE_URL;
    if (!url) return undefined;
    url = url.trim();
    const baseUrl = url.split('?')[0];
    const params = new URLSearchParams(url.split('?')[1] || '');
    const paramStr = params.toString();
    return paramStr ? `${baseUrl}?${paramStr}` : baseUrl;
};

const prisma = new PrismaClient({
    datasources: { db: { url: getDatabaseUrl() } },
});

const getTxTableName = () => '"Transaction"';

const getLegacyManilaISO = () => new Date().toISOString();

function generateSecureReferenceId() {
  const timestamp = getLegacyManilaISO()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14);
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `JON-${timestamp}-${randomBytes}`;
}

async function testCreateIntent() {
  console.log('Connecting to:', getDatabaseUrl());
  try {
    const amount = 2123;
    const parsedAmount = parseFloat(amount / 100);
    const orderId = "test_123";
    const description = "Test";
    const provider = "internal";
    const metadataStr = JSON.stringify({orderId});

    console.log('0.1 Querying existing...');
    const likePattern = `%"orderId":"${orderId}"%`;
    const tableName = getTxTableName();
    const existing = await prisma.$queryRawUnsafe(
      `SELECT id, "referenceId", amount FROM ${tableName} WHERE status = 'PENDING' AND type = 'MERCHANT_PAYMENT' AND metadata LIKE $1 LIMIT 1`,
      likePattern
    );
    console.log('Existing:', existing);

    console.log('1. Inserting new...');
    const txId = crypto.randomUUID();
    const referenceId = generateSecureReferenceId();
    
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${tableName} (id, amount, type, status, description, "referenceId", metadata, fee, "createdAt") VALUES ($1, $2, 'MERCHANT_PAYMENT', 'PENDING', $3, $4, $5, 0.0, NOW())`,
      txId,
      parsedAmount,
      description || `Payment Intent via ${provider}`,
      referenceId,
      metadataStr
    );
    console.log('Success inserted', referenceId);

  } catch (err) {
    console.error('ERROR OCCURRED:');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateIntent();
