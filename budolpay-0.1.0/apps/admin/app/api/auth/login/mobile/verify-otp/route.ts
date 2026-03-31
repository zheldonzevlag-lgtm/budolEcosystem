import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * WHY: This endpoint was missing during the Vercel migration, causing mobile login to fail after ORP entry.
 * It replaces the Express /login/mobile/verify-otp endpoint.
 * WHAT: Verifies the 6-digit OTP code, clears it from the DB, and optionaly trusts the device.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, otp, deviceId, type } = body;

        if (!userId || !otp) {
            return NextResponse.json({ error: 'userId and otp are required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 1. Verify OTP Code
        if (user.otpCode !== otp) {
            return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
        }

        // 2. Verify Expiration
        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            return NextResponse.json({ error: 'OTP code has expired' }, { status: 400 });
        }

        // 3. Update User Verification Status
        const updateData: any = {
            otpCode: null,
            otpExpiresAt: null,
            otpUpdatedAt: null,
        };

        // Standard verification flags (Mirrors Local index.js:1118)
        if (type === 'EMAIL' || type === 'BOTH' || !type) updateData.emailVerified = true;
        if (type === 'SMS' || type === 'BOTH' || !type) updateData.phoneVerified = true;

        // 4. Handle Device Trust (Mirrors Local index.js:1122)
        if (deviceId) {
            let trustedDevices: any[] = [];
            try {
                if (user.trustedDevices) {
                    trustedDevices = user.trustedDevices.startsWith('[')
                        ? JSON.parse(user.trustedDevices)
                        : user.trustedDevices.split(',').map(id => ({ deviceId: id, isVerified: true, addedAt: new Date(), lastUsed: new Date() }));
                }
            } catch (e) {
                console.error('[Verify OTP] Failed to parse trustedDevices:', e);
            }

            const deviceIndex = trustedDevices.findIndex((d: any) => d.deviceId === deviceId);
            if (deviceIndex !== -1) {
                trustedDevices[deviceIndex].isVerified = true;
                trustedDevices[deviceIndex].lastUsed = new Date();
            } else {
                trustedDevices.push({
                    deviceId,
                    isVerified: true,
                    addedAt: new Date(),
                    lastUsed: new Date()
                });
            }
            updateData.trustedDevices = JSON.stringify(trustedDevices);
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        // 5. Determine Next Step
        // If PIN is not set, they need to set up a PIN
        if (!user.pinHash) {
            return NextResponse.json({
                status: 'PIN_SETUP_REQUIRED',
                message: 'OTP verified. Please set up your security PIN.'
            });
        }

        // Otherwise proceed to PIN entry (or auto-login if logic allows, but local returns AUTH_REQUIRED)
        return NextResponse.json({
            status: 'AUTH_REQUIRED',
            message: 'OTP verified. Please enter your PIN to login.',
            methods: ['PIN']
        });

    } catch (error: any) {
        console.error('[API Verify OTP Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
