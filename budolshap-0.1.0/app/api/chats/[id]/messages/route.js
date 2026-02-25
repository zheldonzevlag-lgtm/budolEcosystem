import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'
import { triggerRealtimeEvent } from '@/lib/realtime'

async function getAuthenticatedUser(request) {
    const auth = getAuthFromRequest(request)
    if (!auth || !auth.decoded) return null

    const decoded = auth.decoded
    if (!decoded.userId && !decoded.id) return null

    return { ...decoded, id: decoded.userId || decoded.id }
}

export async function GET(request, { params }) {
    try {
        const user = await getAuthenticatedUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Verify user is part of this chat
        const chat = await prisma.chat.findUnique({
            where: { id }
        })

        if (!chat || (chat.buyerId !== user.id && chat.sellerId !== user.id)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const messages = await prisma.message.findMany({
            where: { chatId: id },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        })

        return NextResponse.json(messages)
    } catch (error) {
        console.error('Error fetching messages:', error)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
}

export async function POST(request, { params }) {
    try {
        const user = await getAuthenticatedUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { content } = body

        if (!content || content.trim() === '') {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
        }

        // Verify user is part of this chat
        const chat = await prisma.chat.findUnique({
            where: { id }
        })

        if (!chat || (chat.buyerId !== user.id && chat.sellerId !== user.id)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                chatId: id,
                senderId: user.id,
                content: content.trim()
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        })

        // Update chat's updatedAt
        await prisma.chat.update({
            where: { id },
            data: { updatedAt: new Date() }
        })

        // Trigger realtime event
        try {
            // Trigger on chat-specific channel (for anyone currently looking at the chat)
            await triggerRealtimeEvent(`chat-${id}`, 'message-received', {
                messageId: message.id,
                chatId: id,
                senderId: user.id,
                content: message.content,
                sender: message.sender,
                createdAt: message.createdAt
            });

            // Also trigger on recipient's user channel for notifications
            const recipientId = chat.buyerId === user.id ? chat.sellerId : chat.buyerId;
            await triggerRealtimeEvent(`user-${recipientId}`, 'message-received', {
                messageId: message.id,
                chatId: id,
                senderId: user.id,
                content: message.content,
                sender: message.sender,
                createdAt: message.createdAt
            });
        } catch (rtError) {
            console.error("[Realtime] Failed to trigger chat event:", rtError);
        }

        return NextResponse.json(message, { status: 201 })
    } catch (error) {
        console.error('Error creating message:', error)
        return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }
}
