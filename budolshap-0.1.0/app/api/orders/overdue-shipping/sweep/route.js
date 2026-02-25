/**
 * API Route: Overdue Shipping Sweep
 * POST /api/orders/overdue-shipping/sweep
 * 
 * Cron job endpoint to identify and handle orders that have exceeded their ship-by deadline
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isBudolShapShippingEnabledServer, getBudolShapShippingSLADaysServer } from '@/lib/shipping/featureFlags';
import { SHIPPING_STATUS } from '@/lib/shipping/shippingContract';
import { triggerRealtimeEvent } from '@/lib/realtime';

export async function POST(request) {
    try {
        // Verify this is a cron job request (simple check for now)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret';

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if BudolShap shipping is enabled
        const settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' }
        });

        if (!isBudolShapShippingEnabledServer(settings)) {
            return NextResponse.json({
                success: true,
                message: 'BudolShap shipping not enabled, skipping sweep',
                processed: 0,
                overdue: 0
            });
        }

        const now = new Date();
        const slaDays = getBudolShapShippingSLADaysServer(settings);
        const deadlineCutoff = new Date(now.getTime() - (slaDays * 24 * 60 * 60 * 1000));

        // Find orders that need processing
        const ordersToCheck = await prisma.order.findMany({
            where: {
                status: { in: ['PAID', 'PROCESSING'] },
                OR: [
                    { shipping: null }, // No shipping data
                    { shipping: { status: SHIPPING_STATUS.NEEDS_ARRANGEMENT } }, // Needs arrangement
                    { shipping: { status: SHIPPING_STATUS.ARRANGED } } // Arranged but not booked
                ]
            },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        userId: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        let processed = 0;
        let overdue = 0;
        let notified = 0;

        for (const order of ordersToCheck) {
            processed++;

            // Calculate ship-by deadline
            const orderDate = new Date(order.createdAt);
            const shipByDeadline = new Date(orderDate.getTime() + (slaDays * 24 * 60 * 60 * 1000));
            const isOverdue = now > shipByDeadline;

            if (isOverdue) {
                overdue++;

                // Update shipping status to indicate overdue
                let shippingData = order.shipping || {};
                shippingData = {
                    ...shippingData,
                    isOverdue: true,
                    overdueSince: now.toISOString(),
                    shipByDeadline: shipByDeadline.toISOString()
                };

                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        shipping: shippingData
                    }
                });

                // Send notification to seller (every 24 hours)
                const lastNotified = shippingData.overdueNotifiedAt ?
                    new Date(shippingData.overdueNotifiedAt) : null;
                const shouldNotify = !lastNotified ||
                    (now - lastNotified) > (24 * 60 * 60 * 1000);

                if (shouldNotify) {
                    notified++;

                    // Update last notified timestamp
                    await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            shipping: {
                                ...shippingData,
                                overdueNotifiedAt: now.toISOString()
                            }
                        }
                    });

                    // Trigger real-time notification
                    try {
                        await triggerRealtimeEvent(`store-${order.storeId}`, 'shipping.overdue', {
                            orderId: order.id,
                            orderNumber: order.id,
                            buyerName: order.user.name,
                            overdueSince: now.toISOString(),
                            shipByDeadline: shipByDeadline.toISOString(),
                            daysOverdue: Math.floor((now - shipByDeadline) / (24 * 60 * 60 * 1000))
                        });
                    } catch (realtimeError) {
                        console.error(`[OverdueSweep] Failed to send realtime notification for order ${order.id}:`, realtimeError);
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Overdue shipping sweep completed',
            processed,
            overdue,
            notified,
            slaDays
        });

    } catch (error) {
        console.error('[OverdueShippingSweep] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint for health check and status
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');

        // Check if BudolShap shipping is enabled
        const settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' }
        });

        if (!isBudolShapShippingEnabledServer(settings)) {
            return NextResponse.json({
                enabled: false,
                message: 'BudolShap shipping not enabled'
            });
        }

        const now = new Date();
        const slaDays = getBudolShapShippingSLADaysServer(settings);

        // Base query for overdue orders
        const baseQuery = {
            where: {
                status: 'PAID',
                OR: [
                    { shipping: null },
                    { shipping: { status: SHIPPING_STATUS.NEEDS_ARRANGEMENT } },
                    { shipping: { status: SHIPPING_STATUS.ARRANGED } }
                ]
            }
        };

        // Add store filter if provided
        if (storeId) {
            baseQuery.where.storeId = storeId;
        }

        // Get all potentially overdue orders
        const potentiallyOverdue = await prisma.order.findMany({
            ...baseQuery,
            select: {
                id: true,
                createdAt: true,
                shipping: true,
                storeId: true
            }
        });

        // Calculate which ones are actually overdue
        const overdueOrders = potentiallyOverdue.filter(order => {
            const orderDate = new Date(order.createdAt);
            const shipByDeadline = new Date(orderDate.getTime() + (slaDays * 24 * 60 * 60 * 1000));
            return now > shipByDeadline;
        });

        return NextResponse.json({
            enabled: true,
            slaDays,
            totalPotentiallyOverdue: potentiallyOverdue.length,
            totalOverdue: overdueOrders.length,
            overdueOrders: overdueOrders.map(order => ({
                id: order.id,
                storeId: order.storeId,
                daysOverdue: Math.floor((now - new Date(order.createdAt).getTime() - (slaDays * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000))
            }))
        });

    } catch (error) {
        console.error('[OverdueShippingSweep] GET Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}