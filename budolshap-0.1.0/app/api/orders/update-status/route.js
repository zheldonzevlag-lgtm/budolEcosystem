import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateOrderStatus } from '@/lib/services/ordersService';

export async function POST(request) {
    try {
        const body = await request.json();
        const { intentId, status } = body;

        if (!intentId || !status) {
            return NextResponse.json({ error: 'Missing intentId or status' }, { status: 400 });
        }

        // Only proceed if payment succeeded
        if (status !== 'succeeded') {
            return NextResponse.json({ message: 'Payment not succeeded, no update needed' });
        }

        // 1. Find the order associated with this payment intent

        // Strategy A: Lookup by paymentId (Intent ID) - Most reliable
        // This relies on checkout/route.js having already linked the intent to the order
        let order = await prisma.order.findFirst({
            where: { paymentId: intentId }
        });

        let orderId = order?.id;

        // Strategy B: Fallback to parsing description from PayMongo if DB link is missing
        if (!orderId) {
            // Verify status with PayMongo (also needed to confirm success)
            const authHeader = `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`;
            const intentResp = await fetch(`https://api.paymongo.com/v1/payment_intents/${intentId}`, {
                headers: { authorization: authHeader }
            });
            const intentData = await intentResp.json();

            if (intentData.errors || intentData.data.attributes.status !== 'succeeded') {
                return NextResponse.json({ error: 'Invalid payment status or intent not found' }, { status: 400 });
            }

            const description = intentData.data.attributes.description; // e.g. "Order #cl... - MAYA"

            // Revised Regex to capture ID at the start, ignoring suffixes like " - MAYA"
            // Matches "Order #id123" or "Order #id123 - MAYA"
            const match = description.match(/Order #([a-zA-Z0-9]+)/);

            if (match && match[1]) {
                orderId = match[1];
            }
        }

        if (!orderId) {
            return NextResponse.json({ error: 'Could not find associated Order ID' }, { status: 404 });
        }

        // 2. Update the order status using the service (includes realtime triggers)
        const updatedOrder = await updateOrderStatus(orderId, {
            isPaid: true,
            status: 'PROCESSING'
        });

        // Also ensure payment reference is stored if not already handled by service
        // (updateOrderStatus handles status, isPaid, paidAt, paymentStatus)
        if (intentId && updatedOrder.paymentId !== intentId) {
            await prisma.order.update({
                where: { id: orderId },
                data: { paymentId: intentId }
            });
        }

        return NextResponse.json({ success: true, order: updatedOrder });

    } catch (error) {
        console.error('Update Order Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
