import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function GET(request: Request) {
    try {
        const preauthToken = request.headers.get('cookie')
            ?.split(';')
            .map(v => v.trim())
            .find(v => v.startsWith('budolpay_preauth_token='))
            ?.split('=')[1];

        if (!preauthToken) {
            return NextResponse.json({ otpRequired: false }, { status: 200 });
        }

        const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
        const ssoUrl = process.env.SSO_URL || `http://${LOCAL_IP}:8000`;
        const verifyResponse = await fetch(`${ssoUrl}/auth/verify`, {
            headers: { Authorization: `Bearer ${decodeURIComponent(preauthToken)}` },
            cache: 'no-store'
        });

        if (!verifyResponse.ok) {
            return NextResponse.json({ otpRequired: false }, { status: 200 });
        }

        const verifyData = await verifyResponse.json();
        if (!verifyData.valid || !verifyData.user?.email) {
            return NextResponse.json({ otpRequired: false }, { status: 200 });
        }

        const localUser = await prisma.user.findUnique({
            where: { email: verifyData.user.email },
            select: { email: true, phoneNumber: true, otpExpiresAt: true }
        });

        if (!localUser) {
            return NextResponse.json({ otpRequired: false }, { status: 200 });
        }

        return NextResponse.json({
            otpRequired: true,
            challenge: {
                email: maskEmail(localUser.email),
                phone: maskPhone(localUser.phoneNumber),
                expiresAt: localUser.otpExpiresAt?.toISOString() || null
            }
        });
    } catch {
        return NextResponse.json({ otpRequired: false }, { status: 200 });
    }
}
