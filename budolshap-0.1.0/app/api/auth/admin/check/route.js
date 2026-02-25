import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromCookies } from '@/lib/auth'
import { getConfiguredAdminEmailSet, isUserAdmin, isAccountTypeAdmin, isEmailConfiguredAsAdmin } from '@/lib/adminAccess'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request) {
    try {
        // Use the standardized requireAdmin for the core check
        const { authorized, user: authUser, errorResponse } = await requireAdmin(request)
        
        // Use the user from requireAdmin if authorized
        if (authorized && authUser) {
            const adminEmailSet = getConfiguredAdminEmailSet()
            const isAdmin = isUserAdmin(authUser, adminEmailSet)
            const accountType = authUser.accountType
            const emailToCheck = authUser.email

            return NextResponse.json({
                isAdmin,
                email: emailToCheck,
                accountType,
                source: authUser.isAdmin ? 'DATABASE_IS_ADMIN' : (isAccountTypeAdmin(accountType) ? 'ACCOUNT_TYPE' : (isEmailConfiguredAsAdmin(emailToCheck, adminEmailSet) ? 'ADMIN_EMAILS' : 'NONE')),
                message: isAdmin
                    ? 'Admin access granted'
                    : 'Assign account type ADMIN, set isAdmin to true, or add the email to ADMIN_EMAILS to grant access.'
            })
        }

        // If not authorized via requireAdmin, return the error
        return errorResponse || NextResponse.json(
            { isAdmin: false, error: 'Not authenticated' },
            { status: 401 }
        )
    } catch (error) {
        console.error('Admin check error:', error)
        return NextResponse.json(
            { isAdmin: false, error: 'Failed to check admin status' },
            { status: 500 }
        )
    }
}

