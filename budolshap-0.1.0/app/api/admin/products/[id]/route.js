import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function PATCH(request, { params }) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { id } = await params
        const body = await request.json()
        const { inStock, price, name, description } = body

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(inStock !== undefined && { inStock }),
                ...(price !== undefined && { price: parseFloat(price) }),
                ...(name && { name }),
                ...(description && { description })
            }
        })

        return NextResponse.json(product)
    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { id } = await params

        await prisma.product.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Product deleted successfully' })
    } catch (error) {
        console.error('Error deleting product:', error)
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
}
