import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/rbac';

/**
 * GET /api/admin/users/roles
 * Returns the RBAC configuration including available roles and permissions.
 */
export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request);
    if (!authorized) return errorResponse;

    try {
        return NextResponse.json({
            roles: Object.values(ROLES),
            permissions: Object.values(PERMISSIONS),
            rolePermissions: ROLE_PERMISSIONS,
            metadata: {
                totalRoles: Object.keys(ROLES).length,
                totalPermissions: Object.keys(PERMISSIONS).length,
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching RBAC configuration:', error);
        return NextResponse.json(
            { error: 'Failed to fetch RBAC configuration' },
            { status: 500 }
        );
    }
}
