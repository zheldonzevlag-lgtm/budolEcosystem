import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * WHY: This endpoint bridges the Vercel production backend for the budolPay Mobile app.
 * It replaces the Express auth-service /verify-otp endpoint (index.js line 1098).
 * WHAT: Verifies the 6-digit OTP for phone/email validation and device trust.
 */
export async function POST(request: Request) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    try {
        const body = await request.json();
        const { userId, otp, type, deviceId } = body;

        if (!userId || !otp) {
            return NextResponse.json({ error: 'User ID and OTP are required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Validate OTP
        if (user.otpCode !== otp) {
            // Log Failure (v43.5)
            await createAuditLog({
                action: 'OTP_VERIFICATION_FAILURE',
                userId: user.id,
                entity: 'User',
                entityId: user.id,
                ipAddress: ip,
                metadata: { reason: 'Invalid OTP code', type, deviceId }
            });

            return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
        }

        if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            // Log Failure (v43.5)
            await createAuditLog({
                action: 'OTP_VERIFICATION_FAILURE',
                userId: user.id,
                entity: 'User',
                entityId: user.id,
                ipAddress: ip,
                metadata: { reason: 'OTP code has expired', type, deviceId }
            });

            return NextResponse.json({ error: 'OTP code has expired' }, { status: 400 });
        }

        // Prepare Update Data
        const updateData: any = {
            otpCode: null,
            otpExpiresAt: null,
            otpUpdatedAt: new Date()
        };

        // Verification Flags
        if (type === 'EMAIL' || type === 'BOTH') updateData.emailVerified = true;
        if (type === 'SMS' || type === 'BOTH') updateData.phoneVerified = true;

        // Device Trust Logic (PCI DSS compliance for MFA)
        if (deviceId) {
            let devices = [];
            try {
                devices = user.trustedDevices ? JSON.parse(user.trustedDevices) : [];
            } catch {
                devices = [];
            }

            const deviceIndex = devices.findIndex((d: any) => d.deviceId === deviceId);
            if (deviceIndex !== -1) {
                devices[deviceIndex].isVerified = true;
                devices[deviceIndex].lastUsed = new Date();
            } else {
                devices.push({
                    deviceId,
                    addedAt: new Date(),
                    lastUsed: new Date(),
                    isVerified: true
                });
            }
            updateData.trustedDevices = JSON.stringify(devices);
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        // Log Success (v43.5)
        await createAuditLog({
            action: 'OTP_VERIFIED',
            userId: user.id,
            entity: 'User',
            entityId: user.id,
            ipAddress: ip,
            metadata: { type, deviceId, compliance: { pci_dss: '10.2.1' } }
        });

        return NextResponse.json({
            success: true,
            status: 'OTP_VERIFIED',
            message: 'Verification successful',
            hasPin: !!user.pinHash
        });

    } catch (error: any) {
        console.error('[API Verify OTP Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
