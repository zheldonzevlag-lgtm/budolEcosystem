import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/orders/[orderId]/add-test-driver
 * Also support GET for easy browser testing
 */
export async function GET(request, { params }) {
    return addTestDriver(params);
}

/**
 * POST /api/orders/[orderId]/add-test-driver
 * Manually add test driver information to an order for testing purposes
 */
export async function POST(request, { params }) {
    return addTestDriver(params);
}

async function addTestDriver(params) {
    try {
        const { orderId } = params;

        console.log('[Add Test Driver] Processing order:', orderId);

        // Get order
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.shipping?.provider !== 'lalamove') {
            return NextResponse.json({
                error: 'Not a Lalamove order',
                provider: order.shipping?.provider
            }, { status: 400 });
        }

        console.log('[Add Test Driver] Current shipping data:', order.shipping);

        // Sample driver data
        const testDriverData = {
            name: "Test Driver 34567",
            phone: "+639171234567",
            plateNumber: "ABC1234",
            vehicleType: "Van",
            rating: 4.8,
            photo: null,
            driverId: "test_driver_34567"
        };

        // Sample location data
        const testLocationData = {
            lat: 14.5995,
            lng: 120.9842,
            updatedAt: new Date().toISOString()
        };

        // Update shipping with test driver info
        const updatedShipping = {
            ...order.shipping,
            driver: testDriverData,
            location: testLocationData,
            estimatedDeliveryTime: new Date(new Date().getTime() + 30 * 60000).toISOString(), // 30 mins from now
            updatedAt: new Date().toISOString()
        };

        console.log('[Add Test Driver] Updating with driver data:', testDriverData);

        await prisma.order.update({
            where: { id: orderId },
            data: {
                shipping: updatedShipping
            }
        });

        console.log('[Add Test Driver] Successfully updated order');

        return NextResponse.json({
            success: true,
            message: 'Test driver information added successfully! Refresh the order page to see the driver card.',
            driver: testDriverData,
            location: testLocationData,
            orderId: orderId,
            refreshUrl: `/orders/${orderId}`
        });

    } catch (error) {
        console.error('[Add Test Driver] Error:', error);
        return NextResponse.json({
            error: 'Failed to add test driver',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
