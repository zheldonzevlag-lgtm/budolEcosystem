import { GET } from '../app/api/admin/security-dashboard/route';
import { prisma } from '../lib/prisma';
import { NextResponse } from 'next/server';

// Mock dependencies
jest.mock('../lib/prisma', () => ({
  prisma: {
    auditLog: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data) => ({ json: () => data })),
  },
}));

describe('Security Dashboard API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return security dashboard data', async () => {
    // Mock Prisma responses
    prisma.auditLog.count.mockResolvedValue(5); // Mock 5 threats/blocked per day
    prisma.auditLog.findMany.mockResolvedValue([
      { action: 'SPAM_ATTEMPT', entity: 'User', createdAt: new Date() }
    ]);
    prisma.auditLog.groupBy.mockResolvedValue([]); // Mock no recent incidents for compliance check

    const response = await GET();
    const data = response.json();

    expect(data).toHaveProperty('compliance');
    expect(data.compliance).toHaveProperty('aiSpamGuard');
    expect(data.compliance.aiSpamGuard.status).toBe('Enabled');
    
    expect(data).toHaveProperty('trends');
    expect(data.trends).toHaveLength(7); // 7 days
    expect(data.trends[0]).toHaveProperty('day');
    expect(data.trends[0]).toHaveProperty('threats', 5);
    
    expect(data).toHaveProperty('vulnerability');
    expect(data.vulnerability).toHaveProperty('integrity', 90);
    
    expect(data).toHaveProperty('aiFindings');
    expect(data.aiFindings.text).toContain('Detected 5 recent failed actions');
  });

  it('should handle errors gracefully', async () => {
    prisma.auditLog.count.mockRejectedValue(new Error('DB Error'));

    const response = await GET();
    // In the actual implementation, we catch errors and return 500
    // But NextResponse.json is mocked to return the object, so we check that object
    // Wait, the real implementation returns NextResponse.json({ error: ... }, { status: 500 })
    // My mock of NextResponse.json returns { json: () => data }
    // The second argument (options) is ignored in my mock.
    // So response.json() should be { error: 'Internal Server Error' }
    
    // Let's adjust the mock or expectation if needed.
    // The implementation: return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    
    const data = response.json();
    expect(data).toEqual({ error: 'Internal Server Error' });
  });
});
