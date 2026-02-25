import { NextResponse } from 'next/server';
import { getReturnById, resolveDispute } from '@/lib/services/returnsService';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * Admin API: Fetch return details
 * GET /api/admin/returns/[returnId]
 */
export async function GET(request, { params }) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { returnId } = await params;

        // 2. Fetch return details
        const returnData = await getReturnById(returnId);
        if (!returnData) {
            return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
        }
        
        return NextResponse.json(returnData);
    } catch (error) {
        console.error('Error fetching return details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch return details', message: error.message },
            { status: 500 }
        );
    }
}

/**
 * Admin API: Resolve return dispute
 * POST /api/admin/returns/[returnId]/resolve
 */
export async function POST(request, { params }) {
    const { authorized, user, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { returnId } = await params;
        const body = await request.json();
        const { resolution, adminNotes } = body;

        // 2. Resolve dispute using service
        const result = await resolveDispute({
            returnId,
            resolution,
            adminId: user.id,
            adminNotes
        });
        
        return NextResponse.json({
            success: true,
            status: result.status,
            message: 'Dispute resolved successfully'
        });
    } catch (error) {
        console.error('Error resolving return dispute:', error);
        return NextResponse.json(
            { error: 'Failed to resolve dispute', message: error.message },
            { status: 500 }
        );
    }
}
