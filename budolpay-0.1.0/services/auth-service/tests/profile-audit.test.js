
const mockCreateAuditLog = jest.fn().mockResolvedValue(true);

jest.mock('@budolpay/audit', () => ({
  createAuditLog: mockCreateAuditLog
}));

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn()
  }
};

jest.mock('@budolpay/database', () => ({
  prisma: mockPrisma
}));

jest.mock('@budolpay/notifications', () => ({
  sendAccountCreationSuccess: jest.fn(),
  sendOTP: jest.fn(),
  sendVerificationSuccess: jest.fn()
}));

const request = require('supertest');
const { app } = require('../index');
const jwt = require('jsonwebtoken');

describe('Profile Update Audit Logging', () => {
  let token;
  const userId = 'user-123';
  const userEmail = 'test@example.com';
  const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

  beforeAll(() => {
    token = jwt.sign({ userId, role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should log audit event when profile is updated', async () => {
    const originalUser = {
      id: userId,
      firstName: 'OldName',
      lastName: 'OldLast',
      email: userEmail,
      kycTier: 'BASIC'
    };

    const updatedUser = {
      ...originalUser,
      firstName: 'NewName'
    };

    mockPrisma.user.findUnique.mockResolvedValue(originalUser);
    mockPrisma.user.update.mockResolvedValue(updatedUser);

    const res = await request(app)
      .patch('/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'NewName'
      });

    expect(res.statusCode).toEqual(200);
    expect(mockCreateAuditLog).toHaveBeenCalledTimes(1);
    
    // Verify audit log arguments
    const auditCall = mockCreateAuditLog.mock.calls[0];
    // arg0: object passed to createCentralizedAuditLog
    const auditParams = auditCall[0];

    expect(auditParams.userId).toEqual(userId);
    expect(auditParams.action).toEqual('PROFILE_UPDATE');
    expect(auditParams.entity).toEqual('User');
    expect(auditParams.entityId).toEqual(userId);
    
    expect(auditParams.metadata).toMatchObject({
      previous: {
        firstName: 'OldName',
        lastName: 'OldLast',
        email: userEmail
      },
      updated: {
        firstName: 'NewName',
        lastName: 'OldLast',
        email: userEmail
      },
      changes: {
        firstName: true,
        lastName: undefined,
        email: undefined
      }
    });
  });

  test('should block name update for fully verified users', async () => {
    const verifiedUser = {
      id: userId,
      firstName: 'Verified',
      lastName: 'User',
      email: userEmail,
      kycTier: 'FULLY_VERIFIED'
    };

    mockPrisma.user.findUnique.mockResolvedValue(verifiedUser);

    const res = await request(app)
      .patch('/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'NewName'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('cannot be changed for verified accounts');
    expect(mockCreateAuditLog).not.toHaveBeenCalled(); // Should not audit if blocked? Or maybe we should audit the attempt?
    // Current implementation does NOT audit the blocked attempt, so verify not called.
  });
});
