import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET user cart
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        let userId = searchParams.get('userId')

        // Handle case where userId is string "undefined" or "null"
        if (userId === 'undefined' || userId === 'null' || !userId) {
            userId = null;
        }

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
        console.error('[CART API] CRITICAL ERROR fetching cart for userId:', userId);
        console.error('[CART API] Message:', error.message);
        console.error('[CART API] Stack:', error.stack);
        
        // Check for Prisma specific errors
        if (error.code) {
            console.error('[CART API] Prisma Error Code:', error.code);
        }

        return NextResponse.json(
            { error: 'Failed to fetch cart', details: error.message, code: error.code },
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
        const cartObj = await prisma.$transaction(async (tx) => {
            // Ensure cart exists
            let userCart = await tx.cart.findUnique({ where: { userId } });
            if (!userCart) {
                userCart = await tx.cart.create({ data: { userId } });
                console.log('[CART API] Created new cart for userId:', userId);
            }

            // Remove existing items
            await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });

            // Prepare new items
            const rawCartItems = Object.entries(cart).map(([key, quantity]) => {
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

            // Filter out items where the product no longer exists to prevent foreign key violations
            const productIds = [...new Set(rawCartItems.map(item => item.productId))];
            const existingProducts = await tx.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true }
            });
            const existingProductIds = new Set(existingProducts.map(p => p.id));

            const cartItems = rawCartItems.filter(item => existingProductIds.has(item.productId));

            if (rawCartItems.length !== cartItems.length) {
                console.warn('[CART API] Filtered out', rawCartItems.length - cartItems.length, 'invalid product items from cart sync');
            }

            if (cartItems.length > 0) {
                // Batch insert using createMany (supported by PostgreSQL/MySQL)
                // If using SQLite, this might need a different approach, but prisma createMany is generally safe for modern DBs
                await tx.cartItem.createMany({ data: cartItems, skipDuplicates: true });
                console.log('[CART API] Inserted', cartItems.length, 'items into cart');
            }

            // Fetch updated items within the same transaction to ensure consistency
            const items = await tx.cartItem.findMany({
                where: { cartId: userCart.id }
            });

            // Transform to { key: quantity } format for the response
            return items.reduce((acc, item) => {
                const key = item.variationId ? `${item.productId}_${item.variationId}` : item.productId;
                acc[key] = item.quantity;
                return acc;
            }, {});
        });

        console.log('[CART API] Updated cart response:', cartObj);
        return NextResponse.json(cartObj);
    } catch (error) {
        console.error('[CART API] CRITICAL ERROR updating cart for userId:', userId);
        console.error('[CART API] Message:', error.message);
        console.error('[CART API] Payload:', JSON.stringify(cart));
        
        if (error.code) {
            console.error('[CART API] Prisma Error Code:', error.code);
        }

        return NextResponse.json(
            { error: 'Failed to update cart', details: error.message, code: error.code },
            { status: 500 }
        );
    }
}

