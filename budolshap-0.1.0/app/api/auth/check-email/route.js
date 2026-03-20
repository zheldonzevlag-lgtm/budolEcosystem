import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const BUDOL_ID_URL = process.env.BUDOL_ID_URL || 'http://localhost:8000';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let identityData = null;
    let identityExists = false;

    try {
        const response = await fetch(`${BUDOL_ID_URL}/auth/check-email?email=${encodeURIComponent(normalizedEmail)}`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });
        const text = await response.text();

        try {
            identityData = JSON.parse(text);
        } catch (e) {
            console.error('[API Check Email] Failed to parse JSON from identity service:', text);
        }

        if (response.ok && identityData) {
            identityExists = !!identityData.exists;
        } else if (!response.ok) {
            console.warn(`[API Check Email] Identity service status ${response.status}:`, identityData);
        }
    } catch (error) {
        console.error('[API Check Email] Identity service error:', error);
    }

    let localUser = null;
    try {
        localUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: normalizedEmail },
                    { email: email?.trim() || '' }
                ]
            },
            select: { id: true, email: true }
        });
    } catch (dbError) {
        console.error('[API Check Email] Local DB lookup failed:', dbError);
    }

    const exists = identityExists || !!localUser;

    if (identityData === null && localUser === null) {
        return NextResponse.json({ error: 'Email check service unavailable' }, { status: 503 });
    }

    return NextResponse.json(
        { exists },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}
