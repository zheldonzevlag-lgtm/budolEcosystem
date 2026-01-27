import { prisma } from '../../budolshap-0.1.0/lib/prisma.js'

async function checkUserOrders() {
  const userId = 'user_1768480365503_97k4qil';
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    console.log(`✅ Found ${orders.length} orders for user ${userId}`);
    orders.forEach(order => {
      console.log(`- Order ID: ${order.id}, Status: ${order.status}, Total: ${order.total}, Paid: ${order.isPaid}`);
      order.orderItems.forEach(item => {
        console.log(`  - Product: ${item.product.name}, Quantity: ${item.quantity}`);
      });
    });
  } catch (error) {
    console.error('❌ Error checking orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserOrders();
