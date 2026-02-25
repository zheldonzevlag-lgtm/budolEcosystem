
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncOrderStatus } from '@/services/shippingOrderUpdater';

export const maxDuration = 60; // Allow 1 minute execution (Vercel limit)

export async function GET(request) {
    // Basic security check (Configure CRON_SECRET in Vercel)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Also allow manual trigger via secret query param for testing ?key=secret
        const { searchParams } = new URL(request.url);
        if (searchParams.get('key') !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        // Find active Lalamove orders that might need syncing
        // We look for PROCESSING (booked), SHIPPED, or PICKED_UP
        const orders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['PROCESSING', 'SHIPPED']
                },
                shipping: {
                    path: ['provider'],
                    equals: 'lalamove'
                }
            },
            orderBy: { updatedAt: 'asc' }, // Update oldest first
            take: 20 // Process 20 at a time to stay within limits
        });

        const results = [];

        for (const order of orders) {
            // Skip if no booking ID
            if (!order.shipping?.bookingId) continue;

            try {
                const result = await syncOrderStatus(order.id);
                results.push({ id: order.id, success: true, changed: result.statusChanged });
            } catch (error) {
                console.error(`Cron sync failed for order ${order.id}:`, error);
                results.push({ id: order.id, success: false, error: error.message });
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            results
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
