import { NextResponse } from 'next/server';
import { getUserById } from '@/lib/services/authService';

/**
 * Internal Auth API - Get User
 * GET /api/internal/auth/user/[userId]
 */
export async function GET(request, { params }) {
    try {
        const { userId } = await params;
        const user = await getUserById(userId);
        return NextResponse.json(user);
    } catch (error) {
        console.error('[Internal Auth] Get user error:', error);
        if (error.message === 'User not found') {
            return NextResponse.json(
                { error: error.message },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { error: error.message || 'Failed to get user' },
            { status: 500 }
        );
    }
}




