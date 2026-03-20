import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { normalizeAccountType } from '@/lib/accountTypes'
import { adminUserInclude, attachAdminFlag, getAdminEmailSet } from '../utils'
import { requireAdmin } from '@/lib/adminAuth'
import { updateUserProfile } from '@/lib/api/budolIdClient'
import { createAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// UPDATE user (admin only)
export async function PUT(request, { params }) {
    // Check admin authentication
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { userId } = await params
        const body = await request.json()
        const { name, email, password, phoneNumber, address, accountType, role, image, emailVerified } = body

        if (!userId) {
            return NextResponse.json(
                { error: 'User id is required' },
                { status: 400 }
            )
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { 
                Address: true,
                store: true
            }
        })

        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        if (!name && !email && !password && !phoneNumber && !address && accountType === undefined && image === undefined) {
            return NextResponse.json(
                { error: 'Nothing to update' },
                { status: 400 }
            )
        }

        const dataToUpdate = {}
        const ssoProfileUpdate = {}

        if (phoneNumber) {
            // Check if phone number is taken by another user
            const phoneUser = await prisma.user.findFirst({
                where: { 
                    phoneNumber,
                    NOT: { id: userId }
                }
            })
            if (phoneUser) {
                return NextResponse.json(
                    { error: 'Phone number is already in use' },
                    { status: 409 }
                )
            }
            dataToUpdate.phoneNumber = phoneNumber
            ssoProfileUpdate.phoneNumber = phoneNumber
        }

        if (address && Object.keys(address).length > 0) {
            const addressData = {
                name: address.name || name || existingUser.name,
                email: address.email || email || existingUser.email,
                phone: address.phone || phoneNumber || existingUser.phoneNumber,
                houseNumber: address.houseNumber || '',
                street: address.street || address.detailedAddress || '',
                barangay: address.barangay || '',
                subdivision: address.subdivision || '',
                landmark: address.landmark || '',
                city: address.city || '',
                state: address.state || '',
                zip: address.zip || '',
                country: address.country || 'Philippines',
                latitude: address.latitude ? parseFloat(address.latitude) : null,
                longitude: address.longitude ? parseFloat(address.longitude) : null,
                buildingName: address.buildingName || '',
                floorUnit: address.floorUnit || '',
                notes: address.notes || ''
            }

            // If user has an address, update it; otherwise create it
            if (existingUser.Address && existingUser.Address.length > 0) {
                dataToUpdate.Address = {
                    update: {
                        where: { id: existingUser.Address[0].id },
                        data: addressData
                    }
                }
            } else {
                dataToUpdate.Address = {
                    create: addressData
                }
            }

            // Sync to StoreAddress if user has a store
            if (existingUser.store) {
                const storeAddressData = {
                    phone: address.phone || phoneNumber || existingUser.phoneNumber,
                    district: address.district || address.state || '',
                    province: address.province || '',
                    city: address.city || '',
                    barangay: address.barangay || '',
                    detailedAddress: address.detailedAddress || address.street || '',
                    zip: address.zip || '',
                    country: address.country || 'Philippines',
                    latitude: address.latitude ? parseFloat(address.latitude) : null,
                    longitude: address.longitude ? parseFloat(address.longitude) : null,
                    notes: address.notes || '',
                    isDefault: true
                }

                // We need to handle this asynchronously but we're in an async function so we can await
                // However, we shouldn't fail the user update if this fails, so maybe try-catch?
                // Or just let it fail if critical. Let's try-catch to be safe.
                try {
                    const existingStoreAddress = await prisma.storeAddress.findFirst({
                        where: { storeId: existingUser.store.id }
                    })

                    if (existingStoreAddress) {
                        await prisma.storeAddress.update({
                            where: { id: existingStoreAddress.id },
                            data: storeAddressData
                        })
                    } else {
                        await prisma.storeAddress.create({
                            data: {
                                ...storeAddressData,
                                storeId: existingUser.store.id
                            }
                        })
                    }
                } catch (storeAddrError) {
                    console.error('Error syncing store address:', storeAddrError)
                }
            }
        }

        if (name) {
            dataToUpdate.name = name
            
            // Split name into first and last for budolID
            const nameParts = name.trim().split(/\s+/);
            ssoProfileUpdate.firstName = nameParts[0];
            ssoProfileUpdate.lastName = nameParts.slice(1).join(' ') || '';
        }

        if (accountType !== undefined) {
            const normalizedAccountType = normalizeAccountType(accountType)
            if (!normalizedAccountType) {
                return NextResponse.json(
                    { error: 'Invalid account type' },
                    { status: 400 }
                )
            }
            dataToUpdate.accountType = normalizedAccountType
            if (normalizedAccountType === 'ADMIN') {
                dataToUpdate.emailVerified = true
            }
            
            // Map accountType to budolID role
            ssoProfileUpdate.role = normalizedAccountType === 'ADMIN' ? 'ADMIN' : 'USER';
        }

        if (role !== undefined) {
            dataToUpdate.role = role
        }

        if (typeof image === 'string') {
            dataToUpdate.image = image
            ssoProfileUpdate.avatarUrl = image
        }

        // Sync changes to budolID if possible
        if (Object.keys(ssoProfileUpdate).length > 0) {
            try {
                let ssoUserId = existingUser.metadata?.ssoUserId;
                
                if (ssoUserId) {
                    await updateUserProfile(ssoUserId, ssoProfileUpdate);
                    console.log(`[Admin Update] Synced changes to budolID for user ${ssoUserId}:`, ssoProfileUpdate);
                } else {
                    console.warn(`[Admin Update] No ssoUserId found for ${existingUser.email}, skipping budolID sync.`);
                }
            } catch (syncError) {
                console.error('[Admin Update] Failed to sync to budolID:', syncError.message);
            }
        }

        if (email) {
            if (email !== existingUser.email) {
                const emailOwner = await prisma.user.findUnique({
                    where: { email }
                })

                if (emailOwner && emailOwner.id !== userId) {
                    return NextResponse.json(
                        { error: 'Another user already uses this email' },
                        { status: 409 }
                    )
                }
            }
            dataToUpdate.email = email
        }

        if (password) {
            if (password.length < 6) {
                return NextResponse.json(
                    { error: 'Password must be at least 6 characters long' },
                    { status: 400 }
                )
            }
            dataToUpdate.password = await hashPassword(password)
        }

        if (emailVerified !== undefined) {
            dataToUpdate.emailVerified = !!emailVerified
        }

        const adminEmailSet = getAdminEmailSet()

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate,
            include: adminUserInclude
        })

        // Log the user update
        await createAuditLog(request.user?.id || null, 'USER_UPDATE', request, {
            entity: 'User',
            entityId: userId,
            status: 'SUCCESS',
            details: `Admin updated user profile`,
            metadata: {
                updatedFields: Object.keys(dataToUpdate),
                targetEmail: updatedUser.email
            }
        });

        return NextResponse.json(attachAdminFlag(updatedUser, adminEmailSet))
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        )
    }
}

// DELETE user (admin only)
export async function DELETE(request, { params }) {
    // Check admin authentication
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { userId } = await params
        const deletedAt = new Date()

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                store: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Use a transaction to ensure all deletions succeed or fail together
        await prisma.$transaction(async (tx) => {
            console.log(`[Admin Delete] Starting transaction for user ${userId}`);

            // 1. Delete OrderItems for user's orders (as buyer)
            const userOrders = await tx.order.findMany({
                where: { userId: userId },
                select: { id: true }
            })
            console.log(`[Admin Delete] Found ${userOrders.length} orders for user`);

            if (userOrders.length > 0) {
                await tx.orderItem.deleteMany({
                    where: {
                        orderId: { in: userOrders.map(o => o.id) }
                    }
                })
                console.log(`[Admin Delete] Deleted OrderItems for user orders`);
            }

            // 2. If user has a store, delete store-related records
            if (user.store) {
                console.log(`[Admin Delete] Deleting store ${user.store.id}`);
                // Get all orders from this store
                const storeOrders = await tx.order.findMany({
                    where: { storeId: user.store.id },
                    select: { id: true }
                })

                // Delete OrderItems for store orders
                if (storeOrders.length > 0) {
                    await tx.orderItem.deleteMany({
                        where: {
                            orderId: { in: storeOrders.map(o => o.id) }
                        }
                    })
                }

                // Delete store orders
                await tx.order.deleteMany({
                    where: { storeId: user.store.id }
                })

                // Delete products (which will cascade to ratings and cart items)
                await tx.product.deleteMany({
                    where: { storeId: user.store.id }
                })

                // Delete the store itself (cascade will handle wallet, transactions, etc.)
                await tx.store.delete({
                    where: { id: user.store.id }
                })
            }

            // 3. Delete user's orders (as buyer) - now that OrderItems are gone
            await tx.order.deleteMany({
                where: { userId: userId }
            })
            console.log(`[Admin Delete] Deleted user orders`);

            // 4. Soft Delete user (set deletedAt to current timestamp)
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { deletedAt }
            })
            console.log(`[Admin Delete] Soft deleted user record. New deletedAt:`, updatedUser.deletedAt);
        })

        try {
            await prisma.$executeRaw`UPDATE "budolid"."User" SET "deletedAt" = ${deletedAt} WHERE id = ${userId}`
            await prisma.$executeRaw`UPDATE "budolpay"."User" SET "deletedAt" = ${deletedAt} WHERE id = ${userId}`
            console.log(`[Admin Delete] Soft deleted user ${userId} from budolid and budolpay schemas.`)
        } catch (schemaDeleteError) {
            console.warn(`[Admin Delete] Failed to soft delete from external schemas (budolid/budolpay):`, schemaDeleteError.message)
        }

        return NextResponse.json({ message: 'User deleted successfully' })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json(
            { error: 'Failed to delete user', details: error.message },
            { status: 500 }
        )
    }
}

