import { NextResponse } from 'next/server'

const BUDOL_ID_URL = process.env.BUDOL_ID_URL || 'http://localhost:8000';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`${BUDOL_ID_URL}/auth/check-email?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || 'Failed to check email' }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[API Check Email] Error:', error);
        return NextResponse.json({ error: 'Identity service unavailable' }, { status: 503 });
    }
}
