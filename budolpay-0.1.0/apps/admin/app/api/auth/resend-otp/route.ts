import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import notifications from '@budolpay/notifications';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * WHY: This endpoint bridges the Vercel production backend for the budolPay Mobile app.
 * It replaces the Express auth-service /resend-otp endpoint (index.js line 1030).
 * WHAT: Generates and resends a new 6-digit OTP for the identified user.
 */
export async function POST(request: Request) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    try {
        const body = await request.json();
        const { userId, type } = body; // type can be 'EMAIL', 'SMS', or 'BOTH'

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 1. Rate Limiting (BSP Circular 808/1108 Aligned)
        const now = new Date();
        if (user.otpUpdatedAt && (now.getTime() - new Date(user.otpUpdatedAt).getTime()) < 60000) {
            return NextResponse.json({
                error: 'Too many requests. Please wait 60 seconds before requesting another OTP.',
                retryAfter: 60
            }, { status: 429 });
        }

        // 2. Generate New OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(now.getTime() + 10 * 60000); // 10 mins

        await prisma.user.update({
            where: { id: userId },
            data: {
                otpCode,
                otpExpiresAt: expiresAt,
                otpUpdatedAt: now
            }
        });

        // 3. Send via dual-channel (BSP Circular 808 compliant)
        const deliveryType = type || 'BOTH';
        console.log(`[Resend-OTP] Resending OTP via ${deliveryType}`);
        try {
            if ((deliveryType === 'EMAIL' || deliveryType === 'BOTH') && user.email && user.email.includes('@')) {
                await notifications.sendOTP(user.email, otpCode, 'EMAIL');
            }
            if ((deliveryType === 'SMS' || deliveryType === 'BOTH') && user.phoneNumber) {
                await notifications.sendOTP(user.phoneNumber, otpCode, 'SMS');
            }
        } catch (err: any) {
            console.error(`[Resend-OTP] sendOTP failed: ${err.message}`);
        }

        // 4. Log Action (v43.5)
        await createAuditLog({
            action: 'OTP_RESENT',
            userId: user.id,
            entity: 'User',
            entityId: user.id,
            ipAddress: ip,
            metadata: { type: deliveryType, compliance: { bsp: 'Circular 808' } }
        });

        return NextResponse.json({
            message: 'OTP resent successfully',
            userId: user.id
        });

    } catch (error: any) {
        console.error('[API Resend OTP Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
