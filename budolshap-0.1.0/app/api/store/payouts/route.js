import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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

        const payouts = await prisma.payoutRequest.findMany({
            where: { storeId: store.id },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(payouts)
    } catch (error) {
        console.error('Error fetching payouts:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const store = await getAuthenticatedStore(request)
        if (!store) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { amount } = body

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
        }

        // Use transaction to ensure consistency
        const result = await prisma.$transaction(async (tx) => {
            // Get wallet
            const wallet = await tx.wallet.findUnique({
                where: { storeId: store.id }
            })

            if (!wallet) {
                throw new Error('Wallet not found')
            }

            if (wallet.balance < amount) {
                throw new Error('Insufficient balance')
            }

            // Deduct from wallet
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: amount } }
            })

            // Create transaction record
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount: amount,
                    type: 'DEBIT',
                    description: 'Payout Request'
                }
            })

            // Create payout request
            const payout = await tx.payoutRequest.create({
                data: {
                    storeId: store.id,
                    amount: amount,
                    status: 'PENDING'
                }
            })

            return payout
        })

        return NextResponse.json(result, { status: 201 })
    } catch (error) {
        console.error('Error requesting payout:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
