import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'

async function getAuthenticatedUser(request) {
    const auth = getAuthFromRequest(request)
    if (!auth || !auth.decoded) return null

    const decoded = auth.decoded
    if (!decoded.userId && !decoded.id) return null

    return { ...decoded, id: decoded.userId || decoded.id }
}

export async function GET(request) {
    try {
        const user = await getAuthenticatedUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get chats where user is either buyer or seller
        const chats = await prisma.chat.findMany({
            where: {
                OR: [
                    { buyerId: user.id },
                    { sellerId: user.id }
                ]
            },
            include: {
                buyer: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                seller: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        logo: true
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json(chats)
    } catch (error) {
        console.error('Error fetching chats:', error)
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const user = await getAuthenticatedUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { storeId } = body

        if (!storeId) {
            return NextResponse.json({ error: 'Missing storeId' }, { status: 400 })
        }

        // Get store and seller info
        const store = await prisma.store.findUnique({
            where: { id: storeId }
        })

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        // Check if chat already exists
        const existingChat = await prisma.chat.findUnique({
            where: {
                buyerId_storeId: {
                    buyerId: user.id,
                    storeId
                }
            },
            include: {
                buyer: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                seller: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        logo: true
                    }
                }
            }
        })

        if (existingChat) {
            return NextResponse.json(existingChat)
        }

        // Create new chat
        const chat = await prisma.chat.create({
            data: {
                buyerId: user.id,
                sellerId: store.userId,
                storeId
            },
            include: {
                buyer: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                seller: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        logo: true
                    }
                }
            }
        })

        return NextResponse.json(chat, { status: 201 })
    } catch (error) {
        console.error('Error creating chat:', error)
        return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
    }
}
