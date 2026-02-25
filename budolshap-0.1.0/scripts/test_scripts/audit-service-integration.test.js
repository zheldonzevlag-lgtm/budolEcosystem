import { createOrder, updateOrderStatus, cancelOrder } from '@/lib/services/ordersService';
import { createReturnRequest, resolveDispute, respondToReturn, receiveReturn } from '@/lib/services/returnsService';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

// Mocks
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn((callback) => callback(prisma)),
    order: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    cart: {
      findUnique: jest.fn(),
    },
    cartItem: {
      deleteMany: jest.fn(),
    },
    return: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    orderItem: {
        findMany: jest.fn().mockResolvedValue([]),
    }
  }
}));

jest.mock('@/lib/audit', () => ({
  createAuditLog: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/realtime', () => ({
  triggerRealtimeEvent: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/escrow', () => ({
  lockFunds: jest.fn().mockResolvedValue(true),
  refundFromLocked: jest.fn().mockResolvedValue(true),
  releaseFromLocked: jest.fn().mockResolvedValue(true),
  creditPendingBalance: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/services/performanceService', () => ({
  updateStorePerformance: jest.fn().mockResolvedValue(true),
  updateBuyerPerformance: jest.fn().mockResolvedValue(true),
}));

describe('Audit Logging Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updateOrderStatus should trigger audit log', async () => {
    const mockOrder = { id: 'order-123', userId: 'user-1', status: 'SHIPPED', isPaid: true };
    const currentOrder = { id: 'order-123', status: 'PROCESSING', userId: 'user-1' };
    
    prisma.order.findUnique.mockResolvedValue(currentOrder);
    prisma.order.update.mockResolvedValue(mockOrder);

    await updateOrderStatus('order-123', { status: 'SHIPPED' });

    expect(createAuditLog).toHaveBeenCalledWith(
      'user-1',
      'ORDER_STATUS_UPDATE',
      null,
      expect.objectContaining({
        entity: 'Order',
        entityId: 'order-123',
        metadata: expect.objectContaining({
          oldStatus: 'PROCESSING',
          newStatus: 'SHIPPED'
        })
      })
    );
  });

  test('createReturnRequest should trigger audit log', async () => {
    const mockOrder = { id: 'order-123', userId: 'user-1', storeId: 'store-1', status: 'DELIVERED', total: 1000 };
    const mockReturn = { id: 'return-1', orderId: 'order-123', status: 'PENDING', refundAmount: 1000 };

    prisma.order.findUnique.mockResolvedValue(mockOrder);
    prisma.return.create.mockResolvedValue(mockReturn);
    prisma.order.update.mockResolvedValue(mockOrder); // Update order status

    await createReturnRequest({
      orderId: 'order-123',
      userId: 'user-1',
      reason: 'DEFECTIVE',
      type: 'REFUND_ONLY',
      refundAmount: 1000
    });

    expect(createAuditLog).toHaveBeenCalledWith(
      'user-1',
      'RETURN_REQUESTED',
      null,
      expect.objectContaining({
        entity: 'Return',
        entityId: 'return-1',
        details: expect.stringContaining('Return requested'),
        metadata: expect.objectContaining({ type: 'REFUND_ONLY' })
      })
    );
  });

  test('respondToReturn should trigger audit log', async () => {
      const mockReturn = { 
          id: 'return-1', 
          orderId: 'order-123', 
          status: 'PENDING', 
          refundAmount: 1000,
          type: 'REFUND_ONLY',
          order: { 
              storeId: 'store-1', 
              status: 'RETURN_REQUESTED',
              store: { userId: 'user-store-owner', wallet: { id: 'wallet-1' } },
              userId: 'user-1'
          } 
      };

      prisma.return.findUnique.mockResolvedValue(mockReturn);
      prisma.return.update.mockResolvedValue({ ...mockReturn, status: 'REFUNDED' });
      prisma.order.update.mockResolvedValue({});

      await respondToReturn({
          returnId: 'return-1',
          storeId: 'store-1',
          action: 'ACCEPT',
          reason: 'Valid return',
          images: [],
          partialAmount: null
      });

      expect(createAuditLog).toHaveBeenCalledWith(
          'user-store-owner',
          'RETURN_SELLER_RESPONSE',
          null,
          expect.objectContaining({
              entity: 'Return',
              entityId: 'return-1',
              details: expect.stringContaining('Seller responded'),
              metadata: expect.objectContaining({ action: 'ACCEPT' })
          })
      );
  });

  test('receiveReturn should trigger audit log', async () => {
    const mockReturn = {
      id: 'return-1',
      orderId: 'order-123',
      status: 'DELIVERED',
      refundAmount: 1000,
      order: {
        storeId: 'store-1',
        status: 'RETURN_SHIPPED',
        store: { userId: 'user-store-owner', wallet: { id: 'wallet-1' } },
        userId: 'user-1'
      }
    };

    prisma.return.findUnique.mockResolvedValue(mockReturn);
    prisma.return.update.mockResolvedValue({ ...mockReturn, status: 'REFUNDED' });
    prisma.order.update.mockResolvedValue({});

    await receiveReturn({
      returnId: 'return-1',
      storeId: 'store-1'
    });

    expect(createAuditLog).toHaveBeenCalledWith(
      'user-store-owner',
      'RETURN_RECEIVED',
      null,
      expect.objectContaining({
        entity: 'Return',
        entityId: 'return-1',
        details: expect.stringContaining('Return received'),
        metadata: expect.objectContaining({ status: 'REFUNDED' })
      })
    );
  });
});
