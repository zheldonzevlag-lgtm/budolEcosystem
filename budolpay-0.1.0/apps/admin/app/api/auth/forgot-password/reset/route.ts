import { NextResponse } from 'next/server';

const BUDOLID_URL = process.env.SSO_URL || process.env.BUDOLID_SSO_URL || 'https://budolid-ten.vercel.app';

export async function POST(request: Request) {
    try {
        const { resetToken, newPassword } = await request.json();

        if (!resetToken || !newPassword) {
            return NextResponse.json({ error: 'Reset token and new password are required' }, { status: 400 });
        }

        const response = await fetch(`${BUDOLID_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resetToken, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || 'Password reset failed' }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[ResetPassword] Error:', error);
        return NextResponse.json({ error: 'Failed to connect to auth service' }, { status: 500 });
    }
}
