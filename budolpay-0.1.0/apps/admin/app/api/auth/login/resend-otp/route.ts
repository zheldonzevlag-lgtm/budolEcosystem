import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import notifications from '@budolpay/notifications';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const maskEmail = (email: string) => {
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    return `${name[0]}***@${domain}`;
};

const maskPhone = (phone?: string | null) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return phone;
    return `${digits.slice(0, 3)}***${digits.slice(-4)}`;
};

export async function POST(request: Request) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    try {
        const preauthToken = request.headers.get('cookie')
            ?.split(';')
            .map(v => v.trim())
            .find(v => v.startsWith('budolpay_preauth_token='))
            ?.split('=')[1];

        if (!preauthToken) {
            return NextResponse.json({ error: 'Login session expired. Please sign in again.' }, { status: 401 });
        }

        const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
        const ssoUrl = process.env.SSO_URL || `http://${LOCAL_IP}:8000`;
        const verifyResponse = await fetch(`${ssoUrl}/auth/verify`, {
            headers: { Authorization: `Bearer ${decodeURIComponent(preauthToken)}` },
            cache: 'no-store'
        });

        if (!verifyResponse.ok) {
            return NextResponse.json({ error: 'Pre-auth verification failed. Please sign in again.' }, { status: 401 });
        }

        const verifyData = await verifyResponse.json();
        if (!verifyData.valid || !verifyData.user?.email) {
            return NextResponse.json({ error: 'Pre-auth verification failed. Please sign in again.' }, { status: 401 });
        }

        const localUser = await prisma.user.findUnique({
            where: { email: verifyData.user.email }
        });
        if (!localUser) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        const now = Date.now();
        if (localUser.otpUpdatedAt && now - new Date(localUser.otpUpdatedAt).getTime() < 60000) {
            return NextResponse.json({ error: 'Please wait before requesting another OTP.', retryAfter: 60 }, { status: 429 });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(now + 10 * 60 * 1000);

        await prisma.user.update({
            where: { id: localUser.id },
            data: {
                otpCode,
                otpExpiresAt,
                otpUpdatedAt: new Date(now)
            }
        });

        if (localUser.email?.includes('@')) {
            await notifications.sendOTP(localUser.email, otpCode, 'EMAIL');
        }
        if (localUser.phoneNumber) {
            await notifications.sendOTP(localUser.phoneNumber, otpCode, 'SMS');
        }

        await createAuditLog({
            action: 'OTP_RESENT',
            userId: localUser.id,
            entity: 'Security',
            entityId: localUser.id,
            ipAddress: ip,
            metadata: { stage: 'LOGIN_CHALLENGE' }
        });

        return NextResponse.json({
            success: true,
            challenge: {
                email: maskEmail(localUser.email),
                phone: maskPhone(localUser.phoneNumber),
                expiresAt: otpExpiresAt.toISOString()
            }
        });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
