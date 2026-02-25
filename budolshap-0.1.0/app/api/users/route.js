import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeAccountType } from '@/lib/accountTypes'
import { createAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// GET user by id or email
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const email = searchParams.get('email')

        if (!id && !email) {
            return NextResponse.json(
                { error: 'id or email is required' },
                { status: 400 }
            )
        }

        const where = id ? { id } : { email }

        const user = await prisma.user.findUnique({
            where,
            include: {
                store: true,
                Address: true,
                buyerOrders: {
                    take: 5,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error fetching user:', error)
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        )
    }
}

// POST create new user
export async function POST(request) {
    try {
        const body = await request.json()
        const { id, name, email, image, cart, accountType } = body

        if (!id || !name || !email) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const normalizedAccountType = normalizeAccountType(accountType, { fallback: 'BUYER' }) || 'BUYER'

        const user = await prisma.user.create({
            data: {
                id,
                name,
                email,
                image: image || '',
                cart: cart || {},
                accountType: normalizedAccountType
            }
        })

        return NextResponse.json(user, { status: 201 })
    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        )
    }
}

// PUT update user
export async function PUT(request) {
    try {
        const body = await request.json()
        const { id, name, email, image, cart, accountType, phoneNumber, password } = body

        if (!id) {
            return NextResponse.json(
                { error: 'id is required' },
                { status: 400 }
            )
        }

        // Strict Validation
        if (name !== undefined && name.trim() === '') {
            return NextResponse.json(
                { error: 'Name cannot be empty' },
                { status: 400 }
            )
        }

        if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        const dataToUpdate = {
            ...(name && { name }),
            ...(email && { email }),
            ...(image !== undefined && { image }),
            ...(cart !== undefined && { cart }),
            ...(phoneNumber !== undefined && { phoneNumber }),
            ...(password && { password })
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
        }

        // Handle Address update/creation if provided in body
        const { address } = body
        if (address) {
            const { 
                city, barangay, detailedAddress, street, 
                latitude, longitude, zip, state, country,
                isDefault, notes 
            } = address

            // If setting as default, unset other default addresses
            if (address.isDefault) {
                await prisma.address.updateMany({
                    where: { userId: id, isDefault: true },
                    data: { isDefault: false }
                })
            }

            // Check if user already has an address
            const existingAddress = await prisma.address.findFirst({
                where: { userId: id }
            })

            const addressData = {
                city: city || '',
                barangay: barangay || null,
                street: detailedAddress || street || '',
                latitude: latitude || 14.5995,
                longitude: longitude || 120.9842,
                zip: zip || '',
                state: state || '',
                country: country || 'Philippines',
                notes: notes || '',
                label: address.label || '',
                isDefault: address.isDefault !== undefined ? address.isDefault : false,
                name: name || body.name || '',
                email: email || body.email || '',
                phone: phoneNumber || body.phoneNumber || ''
            }

            if (existingAddress) {
                // If it's the only address, it must be default
                const addressCount = await prisma.address.count({ where: { userId: id } })
                if (addressCount === 1) {
                    addressData.isDefault = true
                }
                
                await prisma.address.update({
                    where: { id: existingAddress.id },
                    data: addressData
                })
            } else {
                // First address is always default
                const addressCount = await prisma.address.count({ where: { userId: id } })
                if (addressCount === 0) {
                    addressData.isDefault = true
                }

                await prisma.address.create({
                    data: {
                        ...addressData,
                        userId: id
                    }
                })
            }
        }

        const user = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
            include: {
                Address: true,
                store: true
            }
        })

        // Sync to StoreAddress if user has a store and address was updated
        if (user.store && address) {
            const { 
                city, barangay, detailedAddress, street, 
                latitude, longitude, zip, state, country,
                district, province, 
                notes 
            } = address

            const storeAddressData = {
                phone: phoneNumber || body.phoneNumber || user.phoneNumber || '',
                district: district || state || '',
                province: province || '',
                city: city || '',
                barangay: barangay || '',
                detailedAddress: detailedAddress || street || '',
                zip: zip || '',
                country: country || 'Philippines',
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                notes: notes || '',
                isDefault: true
            }

            try {
                const existingStoreAddress = await prisma.storeAddress.findFirst({
                    where: { storeId: user.store.id }
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
                            storeId: user.store.id
                        }
                    })
                }
            } catch (storeAddrError) {
                console.error('Error syncing store address:', storeAddrError)
            }
        }

        // Audit Log for Profile Update
        await createAuditLog(id, 'USER_PROFILE_UPDATE', request, {
            entity: 'User',
            entityId: id,
            details: 'User profile updated via API',
            metadata: {
                updatedFields: Object.keys(dataToUpdate),
                hasAddressUpdate: !!body.address
            }
        });

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        )
    }
}

