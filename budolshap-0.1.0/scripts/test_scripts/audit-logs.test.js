
import { createAuditLog } from '../../lib/audit';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
    prisma: {
        auditLog: {
            create: jest.fn().mockResolvedValue({
                id: 'test-log-id',
                action: 'TEST_ACTION',
                status: 'SUCCESS'
            })
        }
    }
}));

// Mock Pusher/Realtime
jest.mock('../../lib/realtime', () => ({
    triggerRealtimeEvent: jest.fn().mockResolvedValue(true)
}));

describe('Audit Log Logic', () => {
    let mockRequest;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest = {
            headers: {
                get: (name) => {
                    const headers = {
                        'x-forwarded-for': '127.0.0.1',
                        'user-agent': 'Jest Test'
                    };
                    return headers[name] || null;
                }
            }
        };
    });

    it('should create an audit log with correct data', async () => {
        await createAuditLog('user-123', 'TEST_ACTION', mockRequest, {
            status: 'SUCCESS',
            details: 'Test Details'
        });

        const { prisma } = require('../../lib/prisma');
        expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                userId: 'user-123',
                action: 'TEST_ACTION',
                status: 'SUCCESS',
                ipAddress: '127.0.0.1'
            })
        }));
    });

    it('should handle missing geolocation headers gracefully', async () => {
        mockRequest.headers.get = () => null;
        
        await createAuditLog('user-123', 'TEST_ACTION', mockRequest);
        
        const { prisma } = require('../../lib/prisma');
        expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should default to Unknown for missing IP', async () => {
        mockRequest.headers.get = () => null;

        await createAuditLog('user-123', 'TEST_ACTION', null); // No request object

        const { prisma } = require('../../lib/prisma');
        expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                ipAddress: 'Unknown',
                country: 'Unknown',
                city: 'Unknown'
            })
        }));
    });

    it('should use Vercel headers when available', async () => {
        mockRequest.headers.get = (name) => {
            const headers = {
                'x-vercel-ip-city': 'Manila',
                'x-vercel-ip-country': 'PH'
            };
            return headers[name];
        };

        await createAuditLog('user-123', 'TEST_ACTION', mockRequest);

        const { prisma } = require('../../lib/prisma');
        expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                city: 'Manila',
                country: 'PH'
            })
        }));
    });
});
