import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const BUDOL_ID_URL = process.env.BUDOL_ID_URL || 'http://localhost:8000';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    console.log(`[API Check Phone] Checking phone: ${phone}`);

    if (!phone) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    let identityData = null;
    let identityExists = false;

    // 1) Try central identity service (budolID)
    try {
        const url = `${BUDOL_ID_URL}/auth/check-phone?phone=${encodeURIComponent(phone)}`;
        console.log(`[API Check Phone] Proxying to: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });
        
        const text = await response.text();
        console.log(`[API Check Phone] Raw response from budolID: ${text}`);
        
        try {
            identityData = JSON.parse(text);
        } catch (e) {
            console.error(`[API Check Phone] Failed to parse JSON from budolID: ${text}`);
        }

        if (response.ok && identityData) {
            identityExists = !!identityData.exists;
        } else if (!response.ok) {
            console.warn(`[API Check Phone] budolID responded with status ${response.status}:`, identityData);
        }
    } catch (error) {
        console.error('[API Check Phone] Error calling budolID:', error);
    }

    // 2) Also check local budolShap user database
    let localUser = null;
    try {
        // Phone numbers are stored normalized (e.g. +639XXXXXXXXX) in budolShap as well,
        // so we can safely compare using the normalized value received from the client.
        localUser = await prisma.user.findFirst({
            where: { phoneNumber: phone }
        });
    } catch (dbError) {
        console.error('[API Check Phone] Local DB lookup failed:', dbError);
    }

    const exists = identityExists || !!localUser;

    // If neither identity service nor local DB lookup worked at all, fail safely.
    if (identityData === null && localUser === null) {
        console.error('[API Check Phone] Both identity service and local DB lookups failed. Returning 503.');
        return NextResponse.json({ error: 'Phone check service unavailable' }, { status: 503 });
    }

    const responsePayload = {
        // Prefer identity service payload if available to keep compatibility,
        // but always override the exists flag with the combined result.
        ...(identityData || {}),
        exists,
        sources: {
            identity: identityExists,
            local: !!localUser
        }
    };

    console.log('[API Check Phone] Final merged result:', responsePayload);

    return NextResponse.json(responsePayload);
}
