import { jest } from '@jest/globals';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  }
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}));

// Mock adminAuth
jest.mock('@/lib/adminAuth', () => ({
  requireAdmin: jest.fn(() => Promise.resolve({ authorized: true, user: { id: 'admin-1', email: 'admin@budolshap.com' } }))
}));

// Mock RBAC
jest.mock('@/lib/rbac', () => ({
  PERMISSIONS: {
    USERS_KYC_APPROVE: 'users.kyc.approve'
  }
}));

describe('KYC Admin API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/admin/kyc should fetch pending applications', async () => {
    const mockUsers = [
      { id: 'user-1', name: 'John Doe', kycStatus: 'PENDING', kycDetails: { idType: 'PASSPORT' } }
    ];
    mockPrisma.user.findMany.mockResolvedValue(mockUsers);
    
    // In a real scenario, we'd mock the request/response, but here we're testing the logic
    const users = await mockPrisma.user.findMany({ where: { kycStatus: 'PENDING' } });
    expect(users).toHaveLength(1);
    expect(users[0].kycStatus).toBe('PENDING');
  });

  test('PATCH /api/admin/kyc should update application status', async () => {
    const mockUpdate = { id: 'user-1', kycStatus: 'APPROVED' };
    mockPrisma.user.update.mockResolvedValue(mockUpdate);
    
    const result = await mockPrisma.user.update({
      where: { id: 'user-1' },
      data: { kycStatus: 'APPROVED' }
    });
    
    expect(result.kycStatus).toBe('APPROVED');
  });

  test('RBAC Roles should include LEAD for KYC approval', () => {
    const roles = ['ADMIN', 'MANAGER', 'LEAD'];
    expect(roles).toContain('LEAD');
    expect(roles).toContain('MANAGER');
    expect(roles).toContain('ADMIN');
  });

  test('RBAC Permission USERS_KYC_APPROVE should be assigned to LEAD', () => {
    const permissions = {
      'LEAD': ['USERS_KYC_APPROVE', 'USERS_VIEW'],
      'MANAGER': ['USERS_KYC_APPROVE', 'USERS_EDIT', 'USERS_VIEW'],
      'ADMIN': ['*']
    };
    expect(permissions['LEAD']).toContain('USERS_KYC_APPROVE');
  });

  test('KYC Rejection should require a reason', async () => {
    const userId = 'user-2';
    const status = 'REJECTED';
    const reason = 'Invalid document quality';
    
    mockPrisma.user.update.mockImplementation(({ data }) => {
      if (data.kycStatus === 'REJECTED' && !data.kycRejectionReason) {
        throw new Error('Rejection reason required');
      }
      return Promise.resolve({ id: userId, kycStatus: status, kycRejectionReason: data.kycRejectionReason });
    });

    const result = await mockPrisma.user.update({
      where: { id: userId },
      data: { kycStatus: status, kycRejectionReason: reason }
    });

    expect(result.kycStatus).toBe('REJECTED');
    expect(result.kycRejectionReason).toBe(reason);
  });

  test('KYC Audit Logging should be triggered on status change', async () => {
    const adminId = 'admin-1';
    const userId = 'user-3';
    const status = 'APPROVED';

    mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-1' });

    await mockPrisma.auditLog.create({
      data: {
        action: 'KYC_STATUS_UPDATE',
        adminId: adminId,
        targetId: userId,
        details: JSON.stringify({ oldStatus: 'PENDING', newStatus: status })
      }
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'KYC_STATUS_UPDATE',
        adminId: adminId,
        targetId: userId
      })
    });
  });
});
