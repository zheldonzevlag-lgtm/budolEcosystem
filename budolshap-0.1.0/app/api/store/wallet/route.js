import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { getSystemSettings } from '@/lib/services/systemSettingsService'

async function getAuthenticatedStore(request) {
    const token = request.cookies.get('budolshap_token')?.value || request.cookies.get('token')?.value
    if (!token) return null

    const decoded = verifyToken(token)
    const userId = decoded?.userId || decoded?.id
    if (!decoded || !userId) return null

    const store = await prisma.store.findUnique({
        where: { userId: userId }
    })

    return store
}

export async function GET(request) {
    try {
        const store = await getAuthenticatedStore(request)
        if (!store) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let wallet = await prisma.wallet.findUnique({
            where: { storeId: store.id },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        // Create wallet if it doesn't exist
        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: { storeId: store.id },
                include: { transactions: true }
            })
        }

        // Get system settings for escrow window
        const settings = await getSystemSettings()
        const protectionWindowDays = settings?.protectionWindowDays || 7

        return NextResponse.json({
            ...wallet,
            protectionWindowDays
        })
    } catch (error) {
        console.error('Error fetching wallet:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
