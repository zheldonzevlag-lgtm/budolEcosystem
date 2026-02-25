import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/services/authService';
import { cookies } from 'next/headers';

/**
 * Internal Auth API - Login
 * POST /api/internal/auth/login
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { user, token } = await authenticateUser(body);

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        });

        return NextResponse.json({
            message: 'Login successful',
            user
        });
    } catch (error) {
        console.error('[Internal Auth] Login error:', error);
        if (error.message === 'Invalid credentials') {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }
        return NextResponse.json(
            { error: error.message || 'Failed to authenticate user' },
            { status: 500 }
        );
    }
}




