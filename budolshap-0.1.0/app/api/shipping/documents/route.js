/**
 * API Route: Generate Shipping Documents
 * POST /api/shipping/documents
 * 
 * Generates waybill and packing list PDFs for arranged shipments
 */

import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateShippingDocuments } from '@/lib/services/shippingService';

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
        const { orderId } = body;

        // Validate required fields
        if (!orderId) {
            return NextResponse.json(
                { error: 'orderId is required' },
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

        // Generate documents
        const result = await generateShippingDocuments(orderId);

        return NextResponse.json(result);

    } catch (error) {
        console.error('[Shipping Documents API] Error:', error);
        
        // Handle specific error types
        if (error.message.includes('not enabled')) {
            return NextResponse.json(
                { error: 'Document generation is not enabled' },
                { status: 503 }
            );
        }

        if (error.message.includes('must be arranged')) {
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
 * GET endpoint to check document generation status
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json(
                { error: 'orderId is required' },
                { status: 400 }
            );
        }

        const decoded = getUserFromRequest(request);
        if (!decoded || !decoded.userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
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

        // Return current document status
        const documents = order.shipping?.documents || {};
        const canGenerate = order.shipping?.status === 'ARRANGED';

        return NextResponse.json({
            orderId,
            documents,
            canGenerate,
            requirements: {
                shippingStatus: 'ARRANGED',
                waybillGenerationEnabled: true // This would be checked against settings
            }
        });

    } catch (error) {
        console.error('[Shipping Documents API] GET Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
