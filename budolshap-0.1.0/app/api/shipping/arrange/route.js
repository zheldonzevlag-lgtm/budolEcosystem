/**
 * API Route: Arrange Shipment
 * POST /api/shipping/arrange
 * 
 * Allows sellers to arrange shipment for orders using the BudolShap-aligned flow
 */

import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { arrangeShipment } from '@/lib/services/shippingService';

export async function POST(request) {
    try {
        const decoded = getUserFromRequest(request);
        if (!decoded || !decoded.userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { orderId, shipmentModel } = body;

        // Validate required fields
        if (!orderId || !shipmentModel) {
            return NextResponse.json(
                { error: 'orderId and shipmentModel are required' },
                { status: 400 }
            );
        }

        // Verify user owns the order's store
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                store: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        if (order.store.userId !== decoded.userId) {
            return NextResponse.json(
                { error: 'Unauthorized: You do not own this order' },
                { status: 403 }
            );
        }

        // Check order status
        if (order.status !== 'PAID') {
            return NextResponse.json(
                { error: 'Order must be in PAID status to arrange shipment' },
                { status: 400 }
            );
        }

        const result = await arrangeShipment(orderId, shipmentModel, {
            userId: decoded.userId
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('[Shipping Arrange API] Error:', error);

        // Handle specific error types
        if (error.message.includes('not enabled')) {
            return NextResponse.json(
                { error: 'BudolShap shipping flow is not enabled' },
                { status: 503 }
            );
        }

        if (error.message.includes('Invalid shipment model')) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        if (error.message.includes('not found')) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint to get shipment arrangement options
 */
export async function GET(_request) {
    try {
        // Return available shipment models
        const shipmentModels = [
            {
                value: 'PICKUP',
                label: 'Pickup',
                description: 'Carrier picks up package from your location'
            },
            {
                value: 'DROPOFF',
                label: 'Drop-off',
                description: 'You drop off package at carrier location'
            }
        ];

        return NextResponse.json({
            shipmentModels,
            requirements: {
                orderStatus: 'PAID',
                shippingStatus: 'NEEDS_ARRANGEMENT'
            }
        });

    } catch (error) {
        console.error('[Shipping Arrange API] GET Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
