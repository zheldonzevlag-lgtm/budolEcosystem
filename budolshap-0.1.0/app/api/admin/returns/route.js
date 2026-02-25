import { NextResponse } from 'next/server';
import { getReturns } from '@/lib/services/returnsService';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * Admin API: Fetch all return requests
 * GET /api/admin/returns
 */
export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        // 2. Extract query parameters
        const { searchParams } = new URL(request.url);
        const filters = {
            status: searchParams.get('status'),
            type: searchParams.get('type'),
            search: searchParams.get('search'),
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '20'
        };

        // 3. Fetch returns using service
        const result = await getReturns(filters);
        
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching admin returns:', error);
        return NextResponse.json(
            { error: 'Failed to fetch return requests', message: error.message },
            { status: 500 }
        );
    }
}
