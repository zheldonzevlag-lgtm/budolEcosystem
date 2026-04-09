import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    try {
        const { otp } = await request.json();
        if (!otp || !/^\d{6}$/.test(otp)) {
            return NextResponse.json({ error: 'A valid 6-digit OTP is required.' }, { status: 400 });
        }

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

        if (!localUser.otpCode || localUser.otpCode !== otp) {
            await createAuditLog({
                action: 'USER_LOGIN_FAILURE',
                userId: localUser.id,
                entity: 'Security',
                entityId: localUser.id,
                ipAddress: ip,
                metadata: { reason: 'Invalid login OTP', stage: 'OTP_VERIFY' }
            });
            return NextResponse.json({ error: 'Invalid OTP code.' }, { status: 400 });
        }

        if (!localUser.otpExpiresAt || localUser.otpExpiresAt < new Date()) {
            return NextResponse.json({ error: 'OTP code expired. Please resend a new code.' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: localUser.id },
            data: {
                otpCode: null,
                otpExpiresAt: null,
                otpUpdatedAt: new Date()
            }
        });

        const response = NextResponse.json({ success: true });
        response.cookies.set('budolpay_token', decodeURIComponent(preauthToken), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7
        });
        response.cookies.set('budolpay_preauth_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0
        });

        await createAuditLog({
            action: 'USER_LOGIN',
            userId: localUser.id,
            entity: 'Security',
            entityId: localUser.id,
            ipAddress: ip,
            metadata: {
                authMethod: 'OTP_CHALLENGE',
                compliance: { pci_dss: '10.2.1', bsp: 'Circular 808' }
            }
        });

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
