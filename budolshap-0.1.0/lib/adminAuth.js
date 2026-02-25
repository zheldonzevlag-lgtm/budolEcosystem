import { verifyToken } from './auth'
import { prisma } from './prisma'
import { hasPermission } from './rbac'
import { createAuditLog } from './audit'

/**
 * Verify if the request is from an admin user
 * @param {Request} request - Next.js request object
 * @param {string} [requiredPermission] - Optional specific permission to check
 * @returns {Promise<{isAdmin: boolean, user: object|null, hasPermission: boolean}>}
 */
export async function verifyAdminAccess(request, requiredPermission = null) {
    try {
        // Use the centralized getAuthFromRequest to handle both cookies and Authorization header
        const auth = await import('./auth').then(m => m.getAuthFromRequest(request))
        
        if (!auth || !auth.token) {
            return { isAdmin: false, user: null, hasPermission: false, error: 'Authentication token missing' }
        }

        const { decoded } = auth
        const userId = decoded?.userId || decoded?.id || decoded?.sub
        console.log(`[AdminAuth] Decoded token for user: ${userId}`);

        if (!decoded || !userId) {
            return { isAdmin: false, user: null, hasPermission: false, error: 'Invalid or expired token. Please Log Out and Log In again.' }
        }

        // Get user from database to check isAdmin, role, and permissions
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                isAdmin: true,
                accountType: true,
                role: true,
                permissions: true
            }
        })
        console.log(`[AdminAuth] User in DB: ${user ? 'Found' : 'NOT FOUND'} (ID: ${userId})`);
        if (user) {
            console.log(`[AdminAuth] User details: isAdmin=${user.isAdmin}, accountType=${user.accountType}`);
        }

        if (!user) {
            return { isAdmin: false, user: null, hasPermission: false, error: 'User account not found' }
        }

        // Support both isAdmin boolean and accountType ADMIN enum
        // Also allow MANAGER and LEAD roles which are administrative roles
        const administrativeRoles = ['ADMIN', 'MANAGER', 'LEAD'];
        const isUserAdmin = user.isAdmin === true || 
                          user.accountType === 'ADMIN' || 
                          administrativeRoles.includes(user.role);

        if (!isUserAdmin) {
            return { isAdmin: false, user: null, hasPermission: false, error: 'Access denied: User is not an administrator' }
        }

        // Check granular permission if required
        let userHasPermission = true
        if (requiredPermission) {
            // Check if user has explicit permission in their permissions JSON
            const explicitPermissions = user.permissions || []
            const hasExplicit = Array.isArray(explicitPermissions) && explicitPermissions.includes(requiredPermission)
            
            // Check if user's role has the permission
            const hasRolePermission = hasPermission(user.role, requiredPermission)
            
            userHasPermission = hasExplicit || hasRolePermission
        }

        return { isAdmin: true, user, hasPermission: userHasPermission }
    } catch (error) {
        console.error('Error verifying admin access:', error)
        return { isAdmin: false, user: null, hasPermission: false, error: 'Internal auth verification error: ' + error.message }
    }
}

/**
 * Middleware helper to check admin access and return error response if not admin
 * @param {Request} request
 * @param {string} [permission] - Optional specific permission to check
 * @returns {Promise<{authorized: boolean, user: object|null, errorResponse: Response|null}>}
 */
export async function requireAdmin(request, permission = null) {
    const { isAdmin, user, hasPermission: permissionOk, error } = await verifyAdminAccess(request, permission)

    if (!isAdmin) {
        // Log the unauthorized access attempt
        // If user is not found, userId should be null for AuditLog
        const logUserId = user?.id || null;
        await createAuditLog(logUserId, 'UNAUTHORIZED_ACCESS', request, {
            entity: 'AdminRoute',
            status: 'FAILURE',
            details: `Blocked admin access attempt. Error: ${error || 'Unknown'}`,
            metadata: {
                permissionRequired: permission,
                path: request.nextUrl?.pathname || 'unknown',
                identity: user?.email || 'anonymous' // Store identity in metadata if not a valid user ID
            }
        });

        const { NextResponse } = await import('next/server')
        return {
            authorized: false,
            user: null,
            errorResponse: NextResponse.json(
                { error: error || 'Unauthorized. Admin access required.' },
                { status: 403 }
            )
        }
    }

    if (permission && !permissionOk) {
        const { NextResponse } = await import('next/server')
        return {
            authorized: false,
            user,
            errorResponse: NextResponse.json(
                { error: `Forbidden. Missing required permission: ${permission}` },
                { status: 403 }
            )
        }
    }

    return {
        authorized: true,
        user,
        errorResponse: null
    }
}
