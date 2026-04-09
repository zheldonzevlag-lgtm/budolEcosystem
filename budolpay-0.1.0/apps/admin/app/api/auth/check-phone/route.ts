import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * WHY: This endpoint bridges the Vercel production backend for the budolPay Mobile app.
 * It replaces the Express auth-service /check-phone endpoint (index.js line 718).
 * WHAT: Checks if a phone number exists in the budolPay DB (local) OR budolID ecosystem.
 * BudolID is the SSO for all services (budolshap, budolpay, etc.).
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');
        const scope = searchParams.get('scope') || 'ALL';
        const excludeUserId = searchParams.get('excludeUserId');

        if (!phone) {
            return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
        }

        // Normalize phone for comparison (BSP Circular 808/1108 Aligned)
        // Strip everything except digits and +
        let normalizedPhone = phone.replace(/\D/g, '');

        // Convert +639... or 639... -> 09...  for local DB match
        if (normalizedPhone.startsWith('63')) {
            normalizedPhone = '0' + normalizedPhone.substring(2);
        }

        // 1. Check local budolPay DB (search all common formats)
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phoneNumber: phone },
                    { phoneNumber: normalizedPhone },
                    { phoneNumber: '+63' + normalizedPhone.substring(1) },
                    { phoneNumber: normalizedPhone.substring(1) },      // bare 9XX format
                ]
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
            }
        });

        if (user && user.id !== excludeUserId) {
            return NextResponse.json({
                exists: true,
                source: 'LOCAL',
                id: user.id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`.trim()
            });
        }

        if (scope === 'LOCAL') {
            return NextResponse.json({ exists: false });
        }

        // 2. Cross-check with budolID (unified SSO/identity across the ecosystem)
        //    WHY: Users may be registered in budolID but not yet in budolPay.
        //    budolID is at https://budol-id-sso.onrender.com
        const BUDOL_ID_URL = process.env.NEXT_PUBLIC_SSO_URL || 'https://budol-id-sso.onrender.com';
        try {
            console.log(`[Vercel Bridge] Checking "${phone}" with budolID...`);
            const resp = await fetch(
                `${BUDOL_ID_URL}/auth/check-phone?phone=${encodeURIComponent(phone)}`,
                { signal: AbortSignal.timeout(5000) }
            );
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.exists) {
                    console.log(`[Vercel Bridge] Phone found in budolID.`);
                    return NextResponse.json({
                        exists: true,
                        source: 'BUDOL_ID',
                        email: data.email,
                        name: data.name
                    });
                }
            }
        } catch (e: any) {
            console.error(`[Vercel Bridge] budolID check failed: ${e.message}`);
            // Non-fatal: if budolID is unreachable, fall through to not found
        }

        return NextResponse.json({ exists: false });

    } catch (error: any) {
        console.error('[API Check Phone Error]', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
