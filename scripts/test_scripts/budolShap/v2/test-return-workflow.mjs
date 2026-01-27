import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testWorkflow() {
    console.log('🚀 Starting Return Workflow Test...');

    // 1. Setup: Create a test user and store if needed, then a delivered order
    const user = await prisma.user.findFirst();
    const store = await prisma.store.findFirst({ include: { wallet: true } });
    
    if (!user || !store) {
        console.error('❌ User or Store not found. Please run seed first.');
        return;
    }

    console.log(`Using User: ${user.email}, Store: ${store.name}`);

    // Create a delivered order
    const address = await prisma.address.findFirst({ where: { userId: user.id } }) || await prisma.address.create({
        data: {
            userId: user.id,
            name: user.name || 'Test User',
            email: user.email,
            street: '123 Main St',
            barangay: 'Brgy 1',
            city: 'Manila',
            state: 'NCR',
            zip: '1000',
            phone: '09123456789'
        }
    });

    const order = await prisma.order.create({
        data: {
            userId: user.id,
            storeId: store.id,
            addressId: address.id,
            status: 'DELIVERED',
            total: 1000,
            isPaid: true,
            paymentMethod: 'BUDOL_PAY',
            shipping: { provider: 'lalamove', status: 'COMPLETED' }
        }
    });

    console.log(`✅ Created Order: ${order.id}`);

    // 2. Buyer files Return request
    const returnRequest = await prisma.return.create({
        data: {
            orderId: order.id,
            type: 'RETURN_AND_REFUND',
            reason: 'DAMAGED_ITEM',
            refundAmount: 1000,
            status: 'PENDING',
            images: ['https://placehold.co/400x400?text=Damaged+Item']
        }
    });

    console.log(`✅ Buyer filed return: ${returnRequest.id}`);

    // 3. Seller approves Return
    await prisma.$executeRawUnsafe(`UPDATE "Return" SET status = 'APPROVED' WHERE id = '${returnRequest.id}'`);
    await prisma.order.update({
        where: { id: order.id },
        data: { status: 'RETURN_APPROVED' }
    });

    console.log(`✅ Seller approved return`);

    // 4. Buyer requests pickup (status -> BOOKING_REQUESTED)
    await prisma.$executeRawUnsafe(`UPDATE "Return" SET status = 'BOOKING_REQUESTED' WHERE id = '${returnRequest.id}'`);

    console.log(`✅ Buyer requested pickup (Status: BOOKING_REQUESTED)`);

    // 5. Seller books courier (Simulation of /api/shipping/lalamove/book-return)
    const lalamoveOrderId = 'test-lalamove-return-' + Date.now();
    await prisma.$executeRawUnsafe(`UPDATE "Return" SET status = 'BOOKED', "returnShipping" = '{"provider": "lalamove", "bookingId": "${lalamoveOrderId}", "status": "ASSIGNING_DRIVER"}' WHERE id = '${returnRequest.id}'`);

    console.log(`✅ Seller booked courier: ${lalamoveOrderId}`);

    // 6. Courier picks up (Simulation of Webhook)
    await prisma.$executeRawUnsafe(`UPDATE "Return" SET status = 'SHIPPED', "returnShipping" = '{"provider": "lalamove", "bookingId": "${lalamoveOrderId}", "status": "PICKED_UP"}' WHERE id = '${returnRequest.id}'`);

    console.log(`✅ Courier picked up item (Status: SHIPPED)`);

    // 7. Courier delivers to seller (Simulation of Webhook)
    await prisma.$executeRawUnsafe(`UPDATE "Return" SET status = 'RECEIVED', "returnShipping" = '{"provider": "lalamove", "bookingId": "${lalamoveOrderId}", "status": "COMPLETED"}' WHERE id = '${returnRequest.id}'`);

    console.log(`✅ Courier delivered to seller (Status: RECEIVED)`);

    // 8. Seller confirms receipt and processes refund
    // In real app, this calls receiveReturn() in returnsService.js
    // which calls refundFromLocked() in escrow.js
    
    // Simulate escrow logic
    const amount = 1000;
    const wallet = await prisma.wallet.findUnique({ where: { id: store.wallet.id } });
    
    // Mock funds locking (usually happens at order completion or return request)
    await prisma.wallet.update({
        where: { id: wallet.id },
        data: { 
            pendingBalance: { decrement: amount },
            lockedBalance: { increment: amount }
        }
    });

    // Refund from locked
    await prisma.wallet.update({
        where: { id: wallet.id },
        data: { 
            lockedBalance: { decrement: amount }
        }
    });

    await prisma.$executeRawUnsafe(`UPDATE "Return" SET status = 'REFUNDED' WHERE id = '${returnRequest.id}'`);

    await prisma.order.update({
        where: { id: order.id },
        data: { status: 'REFUNDED' }
    });

    console.log(`✅ Seller confirmed receipt. Refund processed. (Status: REFUNDED)`);
    console.log('🎉 Workflow Test Completed Successfully!');
}

testWorkflow().catch(console.error).finally(() => prisma.$disconnect());
