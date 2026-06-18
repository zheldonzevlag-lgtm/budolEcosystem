import { NextResponse } from 'next/server';

const BUDOLID_URL = process.env.SSO_URL || process.env.BUDOLID_SSO_URL || 'https://budolid-ten.vercel.app';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const response = await fetch(`${BUDOLID_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || 'Failed to send OTP' }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[ForgotPassword] Error:', error);
        return NextResponse.json({ error: 'Failed to connect to auth service' }, { status: 500 });
    }
}
