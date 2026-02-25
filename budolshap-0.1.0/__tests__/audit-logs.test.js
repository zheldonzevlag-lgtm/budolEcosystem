import { createAuditLog } from '../lib/audit';
import { prisma } from '../lib/prisma';
import { triggerRealtimeEvent } from '../lib/realtime';

// Mock dependencies
jest.mock('../lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../lib/realtime', () => ({
  triggerRealtimeEvent: jest.fn(),
}));

// Mock Request object
const mockRequest = (headers = {}) => ({
  headers: {
    get: (key) => headers[key] || null,
  },
});

describe('createAuditLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() => Promise.resolve({
      json: () => Promise.resolve({ status: 'fail' })
    }));
  });

  it('should create an audit log with minimal required fields', async () => {
    const userId = 'user-123';
    const action = 'TEST_ACTION';
    const req = mockRequest({ 'x-forwarded-for': '127.0.0.1' });

    prisma.auditLog.create.mockResolvedValue({ id: 'log-1', userId, action });

    await createAuditLog(userId, action, req);

    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId,
        action,
        ipAddress: '127.0.0.1',
      }),
    }));
  });

  it('should create an audit log with extended forensic fields', async () => {
    const userId = 'user-123';
    const action = 'FORENSIC_EVENT';
    const req = mockRequest({ 'x-forwarded-for': '1.2.3.4' });
    const options = {
      entity: 'Order',
      entityId: 'ord-123',
      details: 'Suspicious activity detected',
      status: 'WARNING',
      metadata: { riskScore: 0.9 }
    };

    prisma.auditLog.create.mockResolvedValue({ id: 'log-2', ...options });

    await createAuditLog(userId, action, req, options);

    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId,
        action,
        entity: 'Order',
        entityId: 'ord-123',
        details: 'Suspicious activity detected',
        status: 'WARNING',
        metadata: expect.objectContaining({ riskScore: 0.9 }),
        ipAddress: '1.2.3.4'
      }),
    }));
  });

  it('should handle anonymous actions (null userId)', async () => {
    const userId = null;
    const action = 'SPAM_ATTEMPT';
    const req = mockRequest({ 'x-forwarded-for': '10.0.0.1' });
    const options = { status: 'FAILURE' };

    await createAuditLog(userId, action, req, options);

    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: null,
        action,
        status: 'FAILURE'
      }),
    }));
  });
  
  it('should trigger realtime event', async () => {
    const userId = 'user-123';
    const action = 'LOGIN';
    const req = mockRequest();
    
    const mockLog = { id: 'log-3', userId, action };
    prisma.auditLog.create.mockResolvedValue(mockLog);

    await createAuditLog(userId, action, req);

    expect(triggerRealtimeEvent).toHaveBeenCalledWith(
      'admin',
      'AUDIT_LOG_CREATED',
      expect.objectContaining({ id: 'log-3' })
    );
  });
});
