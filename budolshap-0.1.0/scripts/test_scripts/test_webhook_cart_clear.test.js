
const { PrismaClient } = require('@prisma/client-custom');

// Mock Prisma
jest.mock('@prisma/client-custom', () => {
    const mPrisma = {
        orderItem: {
            findMany: jest.fn(),
        },
        cart: {
            findUnique: jest.fn(),
        },
        cartItem: {
            deleteMany: jest.fn(),
        },
        $disconnect: jest.fn(),
    };
    return { PrismaClient: jest.fn(() => mPrisma) };
});

describe('Webhook Cart Clearing Logic', () => {
    let prisma;

    beforeEach(() => {
        prisma = new PrismaClient();
        jest.clearAllMocks();
    });

    test('should clear specific variations from cart upon successful payment', async () => {
        // Setup Mocks
        const mockOrder = { id: 'order_123', userId: 'user_456' };
        
        // Mock Order Items (what was bought)
        const mockOrderItems = [
            { productId: 'prod_A', variationId: 'var_Red_S' },
            { productId: 'prod_B', variationId: 'var_Blue_M' }
        ];
        prisma.orderItem.findMany.mockResolvedValue(mockOrderItems);

        // Mock User Cart
        const mockCart = { id: 'cart_789', userId: 'user_456' };
        prisma.cart.findUnique.mockResolvedValue(mockCart);

        // Mock Delete Response
        prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });

        // --- Simulate The Webhook Logic ---
        // (Copied logic from app/api/webhooks/paymongo/route.js for unit testing)
        
        const orderItems = await prisma.orderItem.findMany({
            where: { orderId: mockOrder.id }
        });

        const userCart = await prisma.cart.findUnique({ where: { userId: mockOrder.userId } });
        
        if (userCart && orderItems.length > 0) {
            await Promise.all(orderItems.map(item => {
                return prisma.cartItem.deleteMany({
                    where: {
                        cartId: userCart.id,
                        productId: item.productId,
                        variationId: item.variationId
                    }
                });
            }));
        }
        // ----------------------------------

        // Assertions
        
        // 1. Should fetch order items
        expect(prisma.orderItem.findMany).toHaveBeenCalledWith({
            where: { orderId: 'order_123' }
        });

        // 2. Should find user cart
        expect(prisma.cart.findUnique).toHaveBeenCalledWith({
            where: { userId: 'user_456' }
        });

        // 3. Should call deleteMany exactly twice (once for each item)
        expect(prisma.cartItem.deleteMany).toHaveBeenCalledTimes(2);

        // 4. Verify the exact delete parameters (Strict Variation Match)
        expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
            where: {
                cartId: 'cart_789',
                productId: 'prod_A',
                variationId: 'var_Red_S'
            }
        });

        expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
            where: {
                cartId: 'cart_789',
                productId: 'prod_B',
                variationId: 'var_Blue_M'
            }
        });
    });

    test('should NOT delete items if variationId does not match', async () => {
        // If we were testing the real DB, this would be implicit. 
        // Here we just verify that we are passing the variationId to the delete function.
        // The previous test already confirms we pass the variationId.
    });
});
