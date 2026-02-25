import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { ROLES, ROLE_PERMISSIONS } from '@/lib/rbac';

/**
 * POST /api/admin/users/sync-rbac
 * Synchronizes all users' roles and permissions based on their account type and store status.
 */
export async function POST(request) {
    const { authorized, errorResponse } = await requireAdmin(request);
    if (!authorized) return errorResponse;

    try {
        const users = await prisma.user.findMany({
            include: {
                store: true
            }
        });

        let updatedCount = 0;
        const updates = [];

        for (const user of users) {
            let targetRole = user.role;
            let needsUpdate = false;

            // 1. Determine target role if not already correctly assigned
            if (user.accountType === 'ADMIN') {
                if (user.role !== ROLES.ADMIN) {
                    targetRole = ROLES.ADMIN;
                    needsUpdate = true;
                }
            } else if (user.accountType === 'SELLER' || user.store) {
                if (user.role !== ROLES.SELLER) {
                    targetRole = ROLES.SELLER;
                    needsUpdate = true;
                }
            } else {
                if (user.role !== ROLES.BUYER && user.role !== ROLES.STAFF && user.role !== ROLES.MANAGER) {
                    // Default to BUYER if not a specialized role
                    targetRole = ROLES.BUYER;
                    needsUpdate = true;
                }
            }

            // 2. Determine permissions based on role
            const standardPermissions = ROLE_PERMISSIONS[targetRole] || [];
            
            // Check if permissions need update (compare as JSON strings for simplicity)
            const currentPermissions = user.permissions || [];
            if (JSON.stringify(currentPermissions) !== JSON.stringify(standardPermissions)) {
                needsUpdate = true;
            }

            if (needsUpdate) {
                updates.push(
                    prisma.user.update({
                        where: { id: user.id },
                        data: {
                            role: targetRole,
                            permissions: standardPermissions,
                            isAdmin: targetRole === ROLES.ADMIN
                        }
                    })
                );
                updatedCount++;
            }
        }

        // Execute all updates in a transaction
        if (updates.length > 0) {
            await prisma.$transaction(updates);
        }

        return NextResponse.json({
            success: true,
            message: `Successfully synchronized ${updatedCount} users.`,
            updatedCount
        });
    } catch (error) {
        console.error('Error synchronizing RBAC roles:', error);
        return NextResponse.json(
            { error: 'Failed to synchronize RBAC roles' },
            { status: 500 }
        );
    }
}
