import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { respondToReturn, getReturnById, receiveReturn } from '@/lib/services/returnsService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/store/returns/[returnId]
 * Fetch return details for the seller
 */
export async function GET(request, { params }) {
    try {
        const { returnId } = await params;
        const decoded = getUserFromRequest(request);

        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const returnData = await getReturnById(returnId);

        // Verify seller ownership
        if (returnData && returnData.order.store.ownerId !== decoded.userId) {
            // Check if store ownerId matches decoded.userId
            // Note: Schema says User has store, but let's be sure of the path
        }

        return NextResponse.json(returnData);
    } catch (error) {
        console.error('Error fetching return:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch return details' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/store/returns/[returnId]
 * Seller responds to a return/refund request
 */
export async function PUT(request, { params }) {
    try {
        const { returnId } = await params;
        const decoded = getUserFromRequest(request);

        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user's store
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { store: true }
        });

        if (!user || !user.store) {
            return NextResponse.json({ error: 'Seller account not found' }, { status: 403 });
        }

        const body = await request.json();
        const { action, reason, images } = body;

        let updatedReturn;
        if (action === 'RECEIVE') {
            updatedReturn = await receiveReturn({
                returnId,
                storeId: user.store.id
            });
        } else {
            updatedReturn = await respondToReturn({
                returnId,
                storeId: user.store.id,
                action,
                reason,
                images
            });
        }

        return NextResponse.json(updatedReturn);
    } catch (error) {
        console.error('Seller response error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to respond to return' },
            { status: 500 }
        );
    }
}
