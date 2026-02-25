import { buyerRespondToProposal } from '../../lib/services/returnsService';
import { prisma } from '../../lib/prisma';
import { triggerRealtimeEvent } from '../../lib/realtime';
import { createAuditLog } from '../../lib/audit';
import { refundFromLocked, releaseFromLocked } from '../../lib/escrow';
import { updateBuyerPerformance, updateStorePerformance } from '../../lib/services/performanceService';

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn((callback) => callback(prisma)),
    return: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      update: jest.fn(),
    },
  },
}));

jest.mock('../../lib/realtime', () => ({
  triggerRealtimeEvent: jest.fn(),
}));

jest.mock('../../lib/audit', () => ({
  createAuditLog: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../lib/escrow', () => ({
  refundFromLocked: jest.fn().mockResolvedValue(true),
  releaseFromLocked: jest.fn().mockResolvedValue(true),
  lockFunds: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../lib/services/performanceService', () => ({
  updateBuyerPerformance: jest.fn(),
  updateStorePerformance: jest.fn(),
}));

// Also mock the alias versions just in case
jest.mock('@/lib/prisma', () => require('../../lib/prisma'), { virtual: true });
jest.mock('@/lib/realtime', () => require('../../lib/realtime'), { virtual: true });
jest.mock('@/lib/audit', () => require('../../lib/audit'), { virtual: true });
jest.mock('@/lib/escrow', () => require('../../lib/escrow'), { virtual: true });
jest.mock('@/lib/services/performanceService', () => require('../../lib/services/performanceService'), { virtual: true });


describe('buyerRespondToProposal', () => {
  const mockReturnId = 'ret_123';
  const mockUserId = 'user_123';
  const mockStoreId = 'store_123';
  const mockOrderId = 'ord_123';

  const mockReturnRequest = {
    id: mockReturnId,
    orderId: mockOrderId,
    refundAmount: 100,
    sellerAction: 'OFFER_PARTIAL',
    status: 'PENDING',
    order: {
      id: mockOrderId,
      userId: mockUserId,
      storeId: mockStoreId,
      status: 'RETURN_REQUESTED',
      total: 500, // Total locked amount
      store: {
        userId: 'seller_user_id',
        wallet: {},
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should process ACCEPT_OFFER correctly', async () => {
    prisma.return.findUnique.mockResolvedValue(mockReturnRequest);
    prisma.return.update.mockResolvedValue({ ...mockReturnRequest, status: 'REFUNDED' });

    const result = await buyerRespondToProposal({
      returnId: mockReturnId,
      userId: mockUserId,
      action: 'ACCEPT_OFFER',
      reason: 'Accepted partial refund',
    });

    // Verify transaction
    expect(prisma.return.findUnique).toHaveBeenCalledWith({
      where: { id: mockReturnId },
      include: expect.any(Object),
    });

    // Verify refund processing
    expect(refundFromLocked).toHaveBeenCalledWith({
      orderId: mockOrderId,
      amount: 100,
    });

    // Verify remainder release (500 - 100 = 400)
    expect(releaseFromLocked).toHaveBeenCalledWith({
      orderId: mockOrderId,
      amount: 400,
    });

    // Verify status updates
    expect(prisma.return.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: mockReturnId },
      data: expect.objectContaining({
        status: 'REFUNDED',
        buyerAction: 'ACCEPT_OFFER',
        isEscrowLocked: false,
      }),
    }));

    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: mockOrderId },
      data: { status: 'REFUNDED' },
    }));

    // Verify realtime events
    expect(triggerRealtimeEvent).toHaveBeenCalledTimes(4); // 2 for return, 2 for order

    // Verify audit log
    expect(createAuditLog).toHaveBeenCalledWith(
      mockUserId,
      'RETURN_BUYER_RESPONSE',
      null,
      expect.any(Object)
    );
  });

  test('should process REJECT_OFFER correctly', async () => {
    prisma.return.findUnique.mockResolvedValue(mockReturnRequest);
    prisma.return.update.mockResolvedValue({ ...mockReturnRequest, status: 'DISPUTED' });

    await buyerRespondToProposal({
      returnId: mockReturnId,
      userId: mockUserId,
      action: 'REJECT_OFFER',
      reason: 'Offer too low',
    });

    // Verify status updates
    expect(prisma.return.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'DISPUTED',
        buyerAction: 'REJECT_OFFER',
      }),
    }));

    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'RETURN_DISPUTED' },
    }));

    // Verify no refund/release called
    expect(refundFromLocked).not.toHaveBeenCalled();
    expect(releaseFromLocked).not.toHaveBeenCalled();
  });

  test('should throw error if unauthorized', async () => {
    prisma.return.findUnique.mockResolvedValue({
      ...mockReturnRequest,
      order: { ...mockReturnRequest.order, userId: 'other_user' },
    });

    await expect(buyerRespondToProposal({
      returnId: mockReturnId,
      userId: mockUserId,
      action: 'ACCEPT_OFFER',
    })).rejects.toThrow('Unauthorized');
  });

  test('should throw error if no pending proposal', async () => {
    prisma.return.findUnique.mockResolvedValue({
      ...mockReturnRequest,
      sellerAction: 'REJECT',
    });

    await expect(buyerRespondToProposal({
      returnId: mockReturnId,
      userId: mockUserId,
      action: 'ACCEPT_OFFER',
    })).rejects.toThrow('No pending proposal from seller');
  });
});
