import { NextResponse } from 'next/server'
import { createGCashSource } from '@/lib/paymongo'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/payment/gcash/create
 * Create a GCash payment source for an order
 */
export async function POST(request) {
    try {
        const body = await request.json()
        const { orderId, userId } = body

        if (!orderId || !userId) {
            return NextResponse.json(
                { error: 'orderId and userId are required' },
                { status: 400 }
            )
        }

        // Get order details
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                address: true,
                store: true
            }
        })

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        // Verify order belongs to user
        if (order.userId !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        // Check if order is already paid
        if (order.isPaid) {
            return NextResponse.json(
                { error: 'Order is already paid' },
                { status: 400 }
            )
        }

        // Convert amount to centavos (PayMongo uses centavos)
        const amountInCentavos = Math.round(order.total * 100)

        // Prepare billing details
        const billing = {
            name: order.user.name,
            email: order.user.email,
            phone: order.address.phone || '09000000000', // Default if not provided
            address: {
                line1: order.address.street,
                line2: order.address.city, // Use city as line2 since barangay doesn't exist
                city: order.address.city,
                state: order.address.state, // Use state field (not province)
                postal_code: order.address.zip || '0000', // Use zip field (not postalCode)
            }
        }

        // Prepare redirect URLs
        const isDevelopment = process.env.NODE_ENV === 'development';

        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'https';

        let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

        if (isDevelopment) {
            baseUrl = 'http://localhost:3000';
        } else if (!baseUrl && host) {
            baseUrl = `${protocol}://${host}`;
        } else if (!baseUrl) {
            baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://budolshap-v3.vercel.app';
        }

        const redirectUrl = {
            success: `${baseUrl}/payment/return?orderId=${orderId}&provider=gcash`,
            failed: `${baseUrl}/payment/return?orderId=${orderId}&provider=gcash`
        }

        // Create GCash payment source
        const source = await createGCashSource(amountInCentavos, billing, redirectUrl)

        // Store source ID in order metadata for later reference
        await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentSourceId: source.data.id,
                paymentStatus: 'pending'
            }
        })

        // Return checkout URL for user to complete payment
        return NextResponse.json({
            checkoutUrl: source.data.attributes.redirect.checkout_url,
            sourceId: source.data.id,
            status: source.data.attributes.status
        })

    } catch (error) {
        console.error('Error creating GCash payment:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create GCash payment' },
            { status: 500 }
        )
    }
}
