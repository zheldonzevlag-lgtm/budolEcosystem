import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'
import { getUserById } from '@/lib/api/budolIdClient'

export async function GET(request) {
    try {
        console.log('[API/Me] Checking authentication...');
        const auth = getAuthFromRequest(request)

        if (!auth) {
            const cookieNames = request.cookies.getAll().map(c => c.name);
            console.log('[API/Me] No auth found. Available cookies:', cookieNames);
            return NextResponse.json(
                { error: 'Unauthorized', details: 'No token found' },
                { status: 401 }
            )
        }

        const { token, decoded } = auth;
        console.log('[API/Me] Auth found for decoded ID:', decoded.sub || decoded.id || decoded.userId);
        const userId = decoded.userId || decoded.id || decoded.sub;

        if (!decoded || !userId) {
            console.log('[API/Me] Invalid token payload:', decoded);
            return NextResponse.json(
                { error: 'Unauthorized', details: 'Invalid token payload' },
                { status: 401 }
            )
        }

        // Check if user exists in local database
        let user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                phoneNumber: true,
                image: true,
                accountType: true,
                role: true,
                isAdmin: true,
                isMember: true,
                isCoopMember: true,
                membershipStatus: true,
                coopMembershipStatus: true,
                store: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        logo: true
                    }
                }
            }
        });

        if (!user) {
            console.log(`[API/Me] User not found in local DB: ${userId}. Attempting sync from BudolID.`);
            try {
                const budolUserRaw = await getUserById(userId);
                const budolUser = budolUserRaw.user || budolUserRaw;
                
                if (budolUser && (budolUser.id === userId || budolUser._id === userId)) {
                     const name = budolUser.name || `${budolUser.firstName || ''} ${budolUser.lastName || ''}`.trim() || 'Budol User';
                     
                     // Create user in local DB
                     user = await prisma.user.create({
                         data: {
                             id: userId,
                             name: name,
                             email: budolUser.email || `${userId}@placeholder.budol`,
                             phoneNumber: budolUser.phoneNumber || '',
                             password: 'SSO_MANAGED_USER', 
                             image: budolUser.profilePicture || budolUser.image || '',
                             accountType: 'BUYER',
                             emailVerified: true,
                             metadata: {
                                 budolId: userId,
                                 syncedAt: new Date().toISOString(),
                                 source: 'me_sync'
                             }
                         },
                         select: {
                            id: true,
                            email: true,
                            name: true,
                            phoneNumber: true,
                            image: true,
                            accountType: true,
                            role: true,
                            isAdmin: true,
                            isMember: true,
                            isCoopMember: true,
                            membershipStatus: true,
                            coopMembershipStatus: true,
                            store: {
                                select: {
                                    id: true,
                                    name: true,
                                    username: true,
                                    logo: true
                                }
                            }
                        }
                     });
                     console.log(`[API/Me] Successfully synced user ${userId} from BudolID.`);
                }
            } catch (syncError) {
                console.error(`[API/Me] Sync failed for ${userId}:`, syncError);
            }
        }

        if (!user) {
            console.log(`[API/Me] User not found in local DB: ${userId}`);
            return NextResponse.json(
                { error: 'User not found', details: 'Session valid but user missing from local database' },
                { status: 404 }
            )
        }

        return NextResponse.json({ user, token })
    } catch (error) {
        console.error('[API/Me] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        )
    }
}

