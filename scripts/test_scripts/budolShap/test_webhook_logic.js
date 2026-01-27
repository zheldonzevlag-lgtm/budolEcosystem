
import { PrismaClient } from '../../../budolshap-0.1.0/node_modules/@prisma/client/index.js';
const prisma = new PrismaClient();
import { normalizeStatus, UNIVERSAL_STATUS } from '../../../budolshap-0.1.0/lib/shipping/statusMapper.js';

async function test() {
  try {
    // 1. Find or create an order for testing
    let order = await prisma.order.findFirst({
      where: {
        shipping: {
          path: ['bookingId'],
          not: null
        }
      },
      include: { user: true, store: true }
    });

    if (!order) {
      console.log('No order with bookingId found. Setting up mock order...');
      const anyOrder = await prisma.order.findFirst({ include: { user: true, store: true } });
      if (!anyOrder) {
        console.error('No orders found at all.');
        return;
      }
      order = await prisma.order.update({
        where: { id: anyOrder.id },
        data: {
          shipping: {
            provider: 'lalamove',
            bookingId: 'MOCK_LALAMOVE_WEBHOOK_TEST',
            status: 'PICKED_UP'
          },
          status: 'SHIPPED'
        },
        include: { user: true, store: true }
      });
    }

    console.log('Using Order ID:', order.id);
    console.log('Current Status:', order.status);
    console.log('Booking ID:', order.shipping.bookingId);

    // 2. Simulate Webhook call (Logic from app/api/webhooks/lalamove/route.js)
    const mockPayload = {
      data: {
        order: {
          orderId: order.shipping.bookingId,
          status: 'COMPLETED' // Lalamove status
        }
      }
    };

    const status = mockPayload.data.order.status;
    const newStatus = normalizeStatus(status, 'lalamove', false);
    console.log('Normalized Status:', newStatus);

    const updatedShipping = {
      ...order.shipping,
      status: status,
      updatedAt: new Date().toISOString()
    };

    const updateData = {
      status: newStatus || undefined,
      shipping: updatedShipping
    };

    if (newStatus === UNIVERSAL_STATUS.DELIVERED && (!order.deliveredAt || order.status !== 'DELIVERED')) {
      updateData.deliveredAt = new Date();
      const autoCompleteDate = new Date();
      autoCompleteDate.setDate(autoCompleteDate.getDate() + 3);
      updateData.autoCompleteAt = autoCompleteDate;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: updateData
    });

    console.log('Updated Status:', updatedOrder.status);
    console.log('Delivered At:', updatedOrder.deliveredAt);
    console.log('Auto Complete At:', updatedOrder.autoCompleteAt);

    if (updatedOrder.status === 'DELIVERED' && updatedOrder.deliveredAt && updatedOrder.autoCompleteAt) {
      console.log('SUCCESS: Order successfully updated to DELIVERED with metadata!');
    } else {
      console.error('FAILURE: Order update failed.');
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
