import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Helper to get authenticated store
async function getAuthenticatedStore(request) {
    const token = request.cookies.get('budolshap_token')?.value || request.cookies.get('token')?.value
    if (!token) return null

    const decoded = verifyToken(token)
    if (!decoded || !decoded.id) return null

    const store = await prisma.store.findUnique({
        where: { userId: decoded.id }
    })

    return store
}

export async function GET(request) {
    try {
        const store = await getAuthenticatedStore(request)
        if (!store) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        return NextResponse.json({ shippingProfile: store.shippingProfile || {} })
    } catch (error) {
        console.error('Error fetching shipping profile:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const store = await getAuthenticatedStore(request)
        if (!store) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { shippingProfile } = body

        if (!shippingProfile) {
            return NextResponse.json({ error: 'Missing shipping profile' }, { status: 400 })
        }

        const updatedStore = await prisma.store.update({
            where: { id: store.id },
            data: { shippingProfile }
        })

        return NextResponse.json({ shippingProfile: updatedStore.shippingProfile })
    } catch (error) {
        console.error('Error updating shipping profile:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
