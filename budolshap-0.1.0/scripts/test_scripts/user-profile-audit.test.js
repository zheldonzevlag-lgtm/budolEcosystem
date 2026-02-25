import { PUT } from '../../app/api/users/route';
import { prisma } from '../../lib/prisma';
import { createAuditLog } from '../../lib/audit';
import { NextResponse } from 'next/server';

// Mocks
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
    address: {
        findFirst: jest.fn(),
    }
  }
}));

jest.mock('../../lib/audit', () => ({
  createAuditLog: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../lib/accountTypes', () => ({
    normalizeAccountType: jest.fn((type) => type),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((data) => ({ json: () => data, status: 200 })),
    }
}));

describe('User Profile Audit Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('PUT should trigger audit log on profile update', async () => {
    const updatedUser = { id: 'user-1', name: 'New Name', email: 'new@test.com' };
    
    prisma.user.update.mockResolvedValue(updatedUser);

    const request = {
        json: jest.fn().mockResolvedValue({
            id: 'user-1',
            name: 'New Name',
            email: 'new@test.com'
        }),
        headers: {
            get: jest.fn(),
        }
    };

    await PUT(request);

    expect(createAuditLog).toHaveBeenCalledWith(
      'user-1',
      'USER_PROFILE_UPDATE',
      request,
      expect.objectContaining({
        entity: 'User',
        entityId: 'user-1',
        details: 'User profile updated via API',
        metadata: expect.objectContaining({
          updatedFields: expect.arrayContaining(['name', 'email']),
          hasAddressUpdate: false
        })
      })
    );
  });
});
