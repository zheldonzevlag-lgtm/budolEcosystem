import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import notifications from '@budolpay/notifications';

export const dynamic = 'force-dynamic';

/**
 * WHY: This endpoint bridges the Vercel production backend for the budolPay Mobile app.
 * It replaces the Express auth-service /login/mobile/identify endpoint (index.js line 768).
 * WHAT: Identifies a user by phone OR email, checks device trust, and triggers OTP if needed.
 * Falls back to budolID SSO for users who exist only in the central identity service.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phoneNumber, deviceId } = body;

        if (!phoneNumber) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        // Detect if input is an email
        const isEmail = phoneNumber.includes('@');
        let normalizedPhone = '';

        if (!isEmail) {
            // Normalize Phone Number (BSP Circular 808/1108 Aligned)
            normalizedPhone = phoneNumber.replace(/\D/g, '');
            // Convert +639... or 639... -> 09...
            if (normalizedPhone.startsWith('63')) {
                normalizedPhone = '0' + normalizedPhone.substring(2);
            }
        }

        // 1. Find user in local budolPay DB
        let user: any = null;
        if (isEmail) {
            user = await prisma.user.findFirst({
                where: { email: phoneNumber.toLowerCase().trim() }
            });
        } else {
            user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { phoneNumber: phoneNumber },
                        { phoneNumber: normalizedPhone },
                        { phoneNumber: '+63' + normalizedPhone.substring(1) },
                        { phoneNumber: normalizedPhone.substring(1) } // bare 9XX format
                    ]
                }
            });
        }

        // 2. BudolID Fallback: Auto-Sync if user not in budolPay DB
        //    WHY: Users registered via budolShap or budolID SSO are in the central identity
        //    service but may not have a budolPay record yet. We auto-provision them.
        if (!user) {
            const BUDOL_ID_URL = process.env.NEXT_PUBLIC_SSO_URL || 'https://budol-id-sso.onrender.com';
            try {
                console.log(`[Vercel Bridge] Identifying "${phoneNumber}" via budolID...`);
                const resp = await fetch(
                    `${BUDOL_ID_URL}/auth/check-phone?phone=${encodeURIComponent(phoneNumber)}`,
                    { signal: AbortSignal.timeout(5000) }
                );
                if (resp.ok) {
                    const data = await resp.json();
                    if (data && data.exists) {
                        console.log(`[Vercel Bridge] Found in budolID. Auto-syncing to budolPay...`);
                        // Auto-provision user in budolPay
                        user = await prisma.user.create({
                            data: {
                                id: data.id || undefined,
                                email: data.email || `${normalizedPhone}@budolID.local`,
                                phoneNumber: normalizedPhone || phoneNumber,
                                firstName: data.name ? data.name.split(' ')[0] : (data.firstName || 'User'),
                                lastName: data.name ? (data.name.split(' ')[1] || '') : (data.lastName || ''),
                                passwordHash: 'SSO_MANAGED',
                                wallet: {
                                    create: {
                                        balance: 0.0,
                                        currency: 'PHP'
                                    }
                                }
                            }
                        });
                        console.log(`[Vercel Bridge] Auto-Sync complete. User ID: ${user.id}`);
                    }
                }
            } catch (syncError: any) {
                console.error(`[Vercel Bridge] budolID sync failed: ${syncError.message}`);
            }
        }

        if (!user) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        // 3. If no PIN is set, user must set it up first
        if (!user.pinHash) {
            return NextResponse.json({
                status: 'PIN_REQUIRED',
                message: 'Please set up your 6-digit PIN',
                userId: user.id
            });
        }

        // 4. Device Trust Verification (PCI DSS 10.x requirement for multi-factor)
        let isDeviceTrusted = false;
        if (user.trustedDevices && deviceId) {
            try {
                // Support both JSON array and comma-separated formats
                const devices = user.trustedDevices.startsWith('[')
                    ? JSON.parse(user.trustedDevices)
                    : user.trustedDevices.split(',').map((id: string) => ({ deviceId: id, isVerified: true }));
                const device = devices.find((d: any) => d.deviceId === deviceId && d.isVerified);
                if (device) isDeviceTrusted = true;
            } catch {
                // Treat as comma-separated fallback
                isDeviceTrusted = user.trustedDevices.split(',').includes(deviceId);
            }
        }

        if (!isDeviceTrusted) {
            // New device or untrusted -> Trigger OTP (BSP Circular 808)
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    otpCode,
                    otpExpiresAt: expiresAt,
                    otpUpdatedAt: new Date()
                }
            });

            // Send via dual-channel (Email + SMS)
            await notifications.sendOTP(user.email || phoneNumber, otpCode, 'BOTH');

            return NextResponse.json({
                status: 'OTP_REQUIRED',
                message: 'A verification code has been sent to your registered contact',
                tempToken: Buffer.from(`${user.id}:${otpCode}`).toString('base64')
            });
        }

        // 5. Device is trusted -> Proceed to PIN/Biometric
        return NextResponse.json({
            status: 'AUTH_REQUIRED',
            message: 'Please enter your security PIN',
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl
        });

    } catch (error: any) {
        console.error('[API Identify Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
