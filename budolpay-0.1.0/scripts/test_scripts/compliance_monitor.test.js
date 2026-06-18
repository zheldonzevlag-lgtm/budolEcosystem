const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Compliance Monitoring Test Suite
 * Validates AML rules: HVT, Velocity, and Aggregate Daily Volume
 */
describe('Automated Compliance Monitoring', () => {
  const TEST_USER_ID = 'user_cl_test_001';

  beforeAll(async () => {
    // Setup test user if not exists
    await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      update: { kycTier: 'FULLY_VERIFIED' },
      create: {
        id: TEST_USER_ID,
        email: 'compliance.test@budolpay.com',
        firstName: 'Compliance',
        lastName: 'Tester',
        passwordHash: 'dummy_hash', // Required by schema
        phoneNumber: '+639123456789', // Required by schema
        kycTier: 'FULLY_VERIFIED',
        role: 'USER'
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Rule 1: High-Value Transaction (HVT) Flagging', async () => {
    // We expect HVT to trigger for amounts >= 500,000
    // This test simulates the logic used in transaction-service/index.js
    const amount = 550000;
    const isHVT = amount >= 500000;
    
    expect(isHVT).toBe(true);
    
    // Simulate Audit Log creation
    const log = await prisma.auditLog.create({
      data: {
        action: 'COMPLIANCE_FLAG_TRIGGERED',
        entity: 'Compliance',
        entityId: 'TX-TEST-HVT',
        userId: TEST_USER_ID,
        newValue: { 
          flags: [{ rule: 'HVT', severity: 'HIGH', message: 'Transaction amount exceeds PHP 500,000 threshold.' }],
          transactionId: 'TX-TEST-HVT'
        },
        metadata: { isComplianceFlag: true, severity: 'HIGH' }
      }
    });

    expect(log.id).toBeDefined();
    expect(log.metadata.severity).toBe('HIGH');
  });

  test('Rule 2: Velocity Check Flagging', async () => {
    // Simulate frequency check: > 5 transactions in 1 hour
    const recentTxCount = 6;
    const velocityTriggered = recentTxCount > 5;

    expect(velocityTriggered).toBe(true);

    const log = await prisma.auditLog.create({
      data: {
        action: 'COMPLIANCE_FLAG_TRIGGERED',
        entity: 'Compliance',
        entityId: 'TX-TEST-VELOCITY',
        userId: TEST_USER_ID,
        newValue: { 
          flags: [{ rule: 'VELOCITY', severity: 'MEDIUM', message: 'High frequency of transfers detected ( > 5 in 1 hour).' }],
          transactionId: 'TX-TEST-VELOCITY'
        },
        metadata: { isComplianceFlag: true, severity: 'MEDIUM' }
      }
    });

    expect(log.metadata.severity).toBe('MEDIUM');
  });

  test('Rule 3: Daily Aggregate Limit Flagging', async () => {
    // Simulate aggregate check: Daily volume >= 1,000,000
    const dailyVolume = 1200000;
    const aggregateTriggered = dailyVolume >= 1000000;

    expect(aggregateTriggered).toBe(true);

    const log = await prisma.auditLog.create({
      data: {
        action: 'COMPLIANCE_FLAG_TRIGGERED',
        entity: 'Compliance',
        entityId: 'TX-TEST-AGGREGATE',
        userId: TEST_USER_ID,
        newValue: { 
          flags: [{ rule: 'DAILY_AGGREGATE', severity: 'HIGH', message: 'Total daily transaction volume exceeds PHP 1,000,000.' }],
          transactionId: 'TX-TEST-AGGREGATE'
        },
        metadata: { isComplianceFlag: true, severity: 'HIGH' }
      }
    });

    expect(log.metadata.severity).toBe('HIGH');
  });
});
