import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { triggerRealtimeEvent } from '@/lib/realtime';

export async function POST(request, { params }) {
    try {
        const { orderId } = await params;
        const body = await request.json();
        const { imageUrl, refNumber, notes } = body;

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        // 1. Authenticate user
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        // 2. Verify order ownership
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        if (order.userId !== decoded.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        // 3. Create/Update payment proof within a transaction to ensure order status updates too
        const result = await prisma.$transaction(async (tx) => {
            const proof = await tx.paymentProof.upsert({
                where: { orderId },
                update: {
                    imageUrl,
                    refNumber,
                    notes,
                    status: 'PENDING',
                    updatedAt: new Date()
                },
                create: {
                    orderId,
                    imageUrl,
                    refNumber,
                    notes,
                    status: 'PENDING'
                }
            });

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'PENDING_VERIFICATION'
                },
                include: {
                    store: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            return { proof, updatedOrder };
        });

        // 4. Trigger real-time updates for store
        try {
            await triggerRealtimeEvent(`store-${result.updatedOrder.storeId}`, 'order-updated', {
                orderId: result.updatedOrder.id,
                status: result.updatedOrder.status,
                paymentMethod: result.updatedOrder.paymentMethod
            });
        } catch (realtimeError) {
            console.error('Failed to trigger realtime event:', realtimeError);
        }

        return NextResponse.json({ 
            success: true, 
            paymentProof: result.proof,
            orderStatus: result.updatedOrder.status
        });

    } catch (error) {
        console.error('Payment proof error:', error);
        return NextResponse.json(
            { error: 'Failed to process payment proof', message: error.message }, 
            { status: 500 }
        );
    }
}
