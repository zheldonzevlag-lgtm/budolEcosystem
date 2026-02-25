import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/services/authService';

/**
 * Internal Auth API - Register
 * POST /api/internal/auth/register
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const user = await registerUser(body);
        return NextResponse.json({ message: 'User registered successfully', user }, { status: 201 });
    } catch (error) {
        console.error('[Internal Auth] Register error:', error);
        if (error.message === 'Email already registered') {
            return NextResponse.json(
                { error: error.message },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: error.message || 'Failed to register user' },
            { status: 500 }
        );
    }
}




