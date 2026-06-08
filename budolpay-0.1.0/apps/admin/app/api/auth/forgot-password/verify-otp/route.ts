import { NextResponse } from 'next/server';

const BUDOLID_URL = process.env.SSO_URL || process.env.BUDOLID_SSO_URL || 'https://budolid-ten.vercel.app';

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        const response = await fetch(`${BUDOLID_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || 'OTP verification failed' }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[VerifyOTP] Error:', error);
        return NextResponse.json({ error: 'Failed to connect to auth service' }, { status: 500 });
    }
}
