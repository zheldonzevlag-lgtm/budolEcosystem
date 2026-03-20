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

        // 1. Resolve all Order IDs for this payment intent
        let targetOrderIds = new Set();

        // 1a. Strategy A: Find orders already linked in DB
        const linkedOrders = await prisma.order.findMany({
            where: { paymentId: intentId },
            select: { id: true }
        });
        linkedOrders.forEach(o => targetOrderIds.add(o.id));

        // 1b. Strategy B: Fetch intent from PayMongo to get full metadata (Source of Truth)
        try {
            const authHeader = `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`;
            const intentResp = await fetch(`https://api.paymongo.com/v1/payment_intents/${intentId}`, {
                headers: { authorization: authHeader }
            });
            const intentData = await intentResp.json();

            if (intentData.data && intentData.data.attributes) {
                const attrs = intentData.data.attributes;
                
                // Only proceed if payment succeeded
                if (attrs.status !== 'succeeded') {
                    console.warn(`[UpdateStatus] Intent ${intentId} status is ${attrs.status}, not succeeded.`);
                    // We don't fail here if we already found some IDs in DB, but we won't add more
                } else {
                    // Extract from metadata.orderIds (Array)
                    const metadata = attrs.metadata;
                    if (metadata?.orderIds) {
                        try {
                            const parsedIds = JSON.parse(metadata.orderIds);
                            if (Array.isArray(parsedIds)) {
                                parsedIds.forEach(id => targetOrderIds.add(id));
                            }
                        } catch (e) {
                            console.error('[UpdateStatus] Failed to parse orderIds metadata:', e);
                        }
                    }

                    // Extract from metadata.orderId (Single)
                    if (metadata?.orderId) {
                        targetOrderIds.add(metadata.orderId);
                    }

                    // Extract from description (Fallback)
                    const description = attrs.description || '';
                    const match = description.match(/Order #([a-zA-Z0-9]+)/);
                    if (match && match[1]) {
                        targetOrderIds.add(match[1]);
                    }
                }
            }
        } catch (fetchError) {
            console.error('[UpdateStatus] Failed to fetch intent from PayMongo:', fetchError);
        }

        const finalOrderIds = Array.from(targetOrderIds);

        if (finalOrderIds.length === 0) {
            return NextResponse.json({ error: 'Could not find associated Order IDs' }, { status: 404 });
        }

        // 2. Update all orders concurrently
        console.log(`[UpdateStatus] Updating ${finalOrderIds.length} orders for intent ${intentId}:`, finalOrderIds);
        
        const updateResults = await Promise.allSettled(finalOrderIds.map(async (id) => {
            return await updateOrderStatus(id, {
                isPaid: true,
                status: 'PROCESSING',
                paymentStatus: 'succeeded'
            });
        }));

        const succeededUpdates = updateResults
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);

        const failedUpdates = updateResults
            .filter(r => r.status === 'rejected')
            .map(r => r.reason);

        if (failedUpdates.length > 0) {
            console.error(`[UpdateStatus] Some orders failed to update:`, failedUpdates);
        }

        return NextResponse.json({ 
            success: true, 
            order: succeededUpdates[0], // Keep for backward compatibility
            orders: succeededUpdates,
            count: succeededUpdates.length,
            failedCount: failedUpdates.length
        });

    } catch (error) {
        console.error('Update Order Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
