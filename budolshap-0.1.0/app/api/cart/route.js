import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET user cart
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        console.log('[CART API] GET request received, userId:', userId)

        if (!userId) {
            console.log('[CART API] No userId provided')
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            )
        }

        console.log('[CART API] Fetching cart for userId:', userId)
        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: { items: true }
        })

        if (!cart) {
            console.log('[CART API] No cart found for userId:', userId)
            return NextResponse.json({})
        }

        // Transform to { [key]: quantity } format
        const cartObj = cart.items.reduce((acc, item) => {
            const key = item.variationId ? `${item.productId}_${item.variationId}` : item.productId;
            acc[key] = item.quantity
            return acc
        }, {})

        console.log('[CART API] Successfully fetched cart:', cartObj)
        return NextResponse.json(cartObj)
    } catch (error) {
        console.error('[CART API] Error fetching cart:', error)
        console.error('[CART API] Error stack:', error.stack)
        return NextResponse.json(
            { error: 'Failed to fetch cart', details: error.message },
            { status: 500 }
        )
    }
}

// PUT update user cart
export async function PUT(request) {
    try {
        const body = await request.json();
        const { userId, cart } = body;

        if (!userId || !cart) {
            console.error('[CART API] Missing userId or cart payload');
            return NextResponse.json({ error: 'userId and cart are required' }, { status: 400 });
        }

        console.log('[CART API] PUT request received for userId:', userId, 'cart payload:', cart);

        // Use transaction to replace cart items atomically
        await prisma.$transaction(async (tx) => {
            // Ensure cart exists
            let userCart = await tx.cart.findUnique({ where: { userId } });
            if (!userCart) {
                userCart = await tx.cart.create({ data: { userId } });
                console.log('[CART API] Created new cart for userId:', userId);
            }

            // Remove existing items
            await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });

            // Prepare new items
            const cartItems = Object.entries(cart).map(([key, quantity]) => {
                const parts = key.split('_');
                const productId = parts[0];
                const variationId = parts.length > 1 ? parts.slice(1).join('_') : null;

                return {
                    cartId: userCart.id,
                    productId,
                    variationId,
                    quantity: Number(quantity)
                };
            });

            if (cartItems.length > 0) {
                await tx.cartItem.createMany({ data: cartItems, skipDuplicates: true });
                console.log('[CART API] Inserted', cartItems.length, 'items into cart');
            }
        });

        // Fetch the updated cart to return the persisted state
        const updatedCart = await prisma.cart.findUnique({
            where: { userId },
            include: { items: true }
        });

        // Transform to { key: quantity } format for the response
        const cartObj = updatedCart?.items?.reduce((acc, item) => {
            const key = item.variationId ? `${item.productId}_${item.variationId}` : item.productId;
            acc[key] = item.quantity;
            return acc;
        }, {}) || {};

        console.log('[CART API] Updated cart response:', cartObj);
        return NextResponse.json(cartObj);
    } catch (error) {
        console.error('[CART API] Error updating cart:', error);
        return NextResponse.json({ error: 'Failed to update cart', details: error.message }, { status: 500 });
    }
}

