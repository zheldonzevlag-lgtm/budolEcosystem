import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_OPTIONS } from '@/lib/auth'
import { verifyToken } from '@/lib/token'
import { createAuditLog } from '@/lib/audit'

export async function POST(request) {
    try {
        const cookieStore = await cookies()
        let token = cookieStore.get('budolshap_token')?.value || cookieStore.get('token')?.value

        // Fallback: Check Authorization header if cookie is missing
        if (!token) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        // Log the logout event before clearing the session
        if (token) {
            try {
                const decoded = verifyToken(token)
                if (decoded && (decoded.userId || decoded.id)) {
                    await createAuditLog(decoded.userId || decoded.id, 'LOGOUT', request, {
                        details: 'User logged out successfully',
                        entity: 'User',
                        entityId: decoded.userId || decoded.id
                    })
                }
            } catch (logError) {
                console.error('Failed to log logout event:', logError)
            }
        }

        // Delete both possible tokens with same options to ensure it clears correctly 
        cookieStore.delete({
            name: 'budolshap_token',
            ...COOKIE_OPTIONS
        })
        cookieStore.delete({
            name: 'token',
            ...COOKIE_OPTIONS
        })

        return NextResponse.json({ message: 'Logged out successfully' })
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { error: 'Failed to logout' },
            { status: 500 }
        )
    }
}

