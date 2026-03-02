import { createAuditLog } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'mock-log-id' }),
    },
    settings: {
      findUnique: jest.fn().mockResolvedValue({
        realtimeProvider: 'POLLING',
        pusherKey: 'mock-pusher-key',
        pusherCluster: 'mock-pusher-cluster',
        socketUrl: 'http://localhost:4000',
        swrPollingInterval: 10000,
      }),
    },
  },
}));

// Mock fetch for geolocation
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ status: 'fail' }), // Fail geolocation to skip it
  })
);

describe('Security Compliance - Audit Logging', () => {
  const originalDate = Date;

  beforeAll(() => {
    // Mock Date to have a fixed timestamp for hash verification
    const fixedDate = new Date('2026-02-16T12:00:00Z');
    global.Date = class extends Date {
      constructor(date) {
        if (date) return new originalDate(date);
        return fixedDate;
      }
      static now() {
        return fixedDate.getTime();
      }
      toISOString() {
          return fixedDate.toISOString();
      }
    };
  });

  afterAll(() => {
    global.Date = originalDate;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('createAuditLog should generate SHA-256 integrity hash', async () => {
    const userId = 'user-123';
    const action = 'TEST_ACTION';
    const req = {
      headers: {
        get: (name) => {
          if (name === 'x-forwarded-for') return '127.0.0.1';
          if (name === 'user-agent') return 'Mozilla/5.0 (Test)';
          return null;
        }
      }
    };
    const options = {
      entity: 'TestEntity',
      entityId: 'entity-456',
      status: 'SUCCESS',
      metadata: { key: 'value' }
    };

    await createAuditLog(userId, action, req, options);

    // Calculate expected hash
    const timestamp = '2026-02-16T12:00:00.000Z'; // Fixed date
    // Note: createAuditLog stringifies metadata in the hash input
    const hashInput = `${userId}:${action}:${options.entityId}:${options.status}:${timestamp}:${JSON.stringify(options.metadata)}`;
    const expectedHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    
    const callArg = prisma.auditLog.create.mock.calls[0][0];
    const createdData = callArg.data;

    // Verify basic fields
    expect(createdData.userId).toBe(userId);
    expect(createdData.action).toBe(action);
    expect(createdData.entityId).toBe(options.entityId);

    // Verify Integrity Hash in metadata
    expect(createdData.metadata).toBeDefined();
    expect(createdData.metadata.integrity).toBeDefined();
    expect(createdData.metadata.integrity.hash).toBe(expectedHash);
    expect(createdData.metadata.integrity.timestamp).toBe(timestamp);
  });

  test('createAuditLog should handle missing user (System Action)', async () => {
    const action = 'SYSTEM_EVENT';
    const req = { headers: { get: () => null } };
    
    await createAuditLog(null, action, req, { status: 'WARNING' });

    expect(prisma.auditLog.create).toHaveBeenCalled();
    const callArg = prisma.auditLog.create.mock.calls[0][0];
    expect(callArg.data.userId).toBeNull();
    expect(callArg.data.status).toBe('WARNING');
  });
});
