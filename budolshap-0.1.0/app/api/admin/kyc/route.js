import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request, PERMISSIONS.USERS_KYC_APPROVE);
    if (!authorized) return errorResponse;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'ALL';

        const users = await prisma.user.findMany({
            where: {
                kycStatus: status === 'ALL' ? undefined : status,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                kycStatus: true,
                kycDetails: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Failed to fetch KYC applications:', error);
        return NextResponse.json({ error: 'Failed to fetch KYC applications' }, { status: 500 });
    }
}

export async function PATCH(request) {
    const { authorized, errorResponse, user: adminUser } = await requireAdmin(request, PERMISSIONS.USERS_KYC_APPROVE);
    if (!authorized) return errorResponse;

    try {
        const { userId, status, reason } = await request.json();

        if (!userId || !status) {
            return NextResponse.json({ error: 'Missing userId or status' }, { status: 400 });
        }

        const oldUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { kycStatus: true, kycDetails: true }
        });

        if (!oldUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                kycStatus: status,
                kycDetails: {
                    ...(typeof oldUser.kycDetails === 'object' ? oldUser.kycDetails : {}),
                    adminAction: {
                        status,
                        reason,
                        actionedBy: adminUser.id,
                        actionedAt: new Date().toISOString(),
                    }
                }
            }
        });

        // Get client info
        // const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        // const userAgent = request.headers.get('user-agent') || 'unknown';

        // Log the activity using centralized audit logger
        await createAuditLog(adminUser.id, 'KYC_STATUS_UPDATE', request, {
            entity: 'User',
            entityId: userId,
            status: 'SUCCESS',
            details: `KYC status updated to ${status}`,
            metadata: {
                oldStatus: oldUser.kycStatus,
                newStatus: status,
                reason,
                adminEmail: adminUser.email
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Failed to update KYC status:', error);
        return NextResponse.json({ error: 'Failed to update KYC status' }, { status: 500 });
    }
}
