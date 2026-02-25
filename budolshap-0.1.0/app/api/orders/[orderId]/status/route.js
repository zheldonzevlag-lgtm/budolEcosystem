import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderStatusEmail } from '@/lib/email'
import { triggerRealtimeEvent } from '@/lib/realtime'

export async function PUT(request, { params }) {
    try {
        const { orderId } = await params
        const body = await request.json()
        const { status, action } = body

        // Handle specific actions first
        if (action === 'EXTEND_GUARANTEE') {
            const order = await prisma.order.findUnique({
                where: { id: orderId }
            })

            if (!order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 })
            }

            if (!['SHIPPED', 'DELIVERED'].includes(order.status)) {
                return NextResponse.json({ error: 'Guarantee can only be extended for Shipped or Delivered orders' }, { status: 400 })
            }

            if (order.isGuaranteeExtended) {
                return NextResponse.json({ error: 'Guarantee has already been extended' }, { status: 400 })
            }

            // Calculate new autoCompleteAt if it exists
            let newAutoCompleteAt = order.autoCompleteAt
            if (newAutoCompleteAt) {
                newAutoCompleteAt = new Date(new Date(newAutoCompleteAt).getTime() + (3 * 24 * 60 * 60 * 1000))
            }

            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    isGuaranteeExtended: true,
                    autoCompleteAt: newAutoCompleteAt
                },
                include: {
                    user: true,
                    store: true
                }
            })

            // Notify via Realtime
            await triggerRealtimeEvent(`user-${updatedOrder.userId}`, 'order-updated', {
                orderId: updatedOrder.id,
                status: updatedOrder.status,
                message: 'budolShap Guarantee extended by 3 days'
            })

            return NextResponse.json(updatedOrder)
        }

        const validStatuses = ['ORDER_PLACED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'REFUNDED']

        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // Get order
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                store: true
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Update order status
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: {
                user: true,
                store: true
            }
        })

        // Notify via Realtime
        await triggerRealtimeEvent(`user-${updatedOrder.userId}`, 'order-updated', {
            orderId: updatedOrder.id,
            status: updatedOrder.status,
            message: `Order status updated to ${status}`
        })

        // Send email notification for certain status changes
        if (['SHIPPED', 'DELIVERED'].includes(status)) {
            await sendOrderStatusEmail(updatedOrder.user.email, updatedOrder, updatedOrder.user, updatedOrder.store, status)
        }

        return NextResponse.json(updatedOrder)
    } catch (error) {
        console.error('Error updating order status:', error)
        return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
    }
}
