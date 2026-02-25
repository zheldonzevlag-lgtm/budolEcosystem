import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { updateOrderStatus as updateOrderInService } from '@/lib/services/ordersService'

export async function PATCH(request, { params }) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { orderId } = await params
        const body = await request.json()
        const { status, isPaid } = body

        if (!status && isPaid === undefined) {
            return NextResponse.json({ error: 'Status or isPaid field is required' }, { status: 400 })
        }

        const order = await updateOrderInService(orderId, { status, isPaid })

        return NextResponse.json(order)
    } catch (error) {
        console.error('Error updating order:', error)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { orderId } = await params

        await prisma.order.delete({
            where: { id: orderId }
        })

        return NextResponse.json({ message: 'Order deleted successfully' })
    } catch (error) {
        console.error('Error deleting order:', error)
        return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
    }
}
