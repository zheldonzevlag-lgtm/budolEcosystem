
const { createOrder } = require('../../lib/services/ordersService');
const { prisma } = require('../../lib/prisma');

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
    prisma: {
        $transaction: jest.fn((callback) => callback(prisma)),
        product: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn()
        },
        address: {
            findFirst: jest.fn()
        },
        order: {
            create: jest.fn()
        },
        checkout: {
            create: jest.fn().mockResolvedValue({ id: 'checkout-123', total: 100 })
        },
        cart: {
            findUnique: jest.fn()
        },
        cartItem: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 })
        }
    }
}));

jest.mock('../../lib/realtime', () => ({
    triggerRealtimeEvent: jest.fn()
}));

jest.mock('../../lib/escrow', () => ({
    creditPendingBalance: jest.fn()
}));

jest.mock('../../lib/audit', () => ({
    createAuditLog: jest.fn().mockResolvedValue({})
}));

describe('ordersService.createOrder - Cart Cleanup', () => {
    const mockUserId = 'user123';
    const mockAddressId = 'addr123';
    const mockProductId = 'prod1';
    const mockCartId = 'cart123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should clean up cart items correctly for product with NO variations', async () => {
        // Setup mock data
        const orderData = {
            userId: mockUserId,
            addressId: mockAddressId,
            orderItems: [
                { productId: mockProductId, quantity: 1 } // No variationId
            ],
            paymentMethod: 'COD'
        };

        // Mock address validation
        prisma.address.findFirst.mockResolvedValue({ id: mockAddressId });

        // Mock product lookup (NO variations)
        prisma.product.findMany.mockResolvedValue([
            {
                id: mockProductId,
                price: 100,
                storeId: 'store1',
                inStock: true,
                variation_matrix: [] // Empty matrix
            }
        ]);
        
        // Mock product lookup for transaction (findUnique)
        prisma.product.findUnique.mockResolvedValue({
            id: mockProductId,
            price: 100,
            storeId: 'store1',
            inStock: true,
            variation_matrix: [],
            stock: 10
        });

        // Mock cart lookup
        prisma.cart.findUnique.mockResolvedValue({ id: mockCartId });

        // Mock order creation
        prisma.order.create.mockResolvedValue({
            id: 'order1',
            storeId: 'store1',
            orderItems: []
        });

        // Execute
        await createOrder(orderData);

        // Verify cart lookup
        expect(prisma.cart.findUnique).toHaveBeenCalledWith({
            where: { userId: mockUserId },
            select: { id: true }
        });

        // Verify cleanup
        expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
            where: {
                cartId: mockCartId,
                OR: [
                    { 
                        productId: mockProductId,
                        OR: [
                            { variationId: null },
                            { variationId: '' }
                        ]
                    } // Should be null or empty string
                ]
            }
        });
    });

    test('should clean up cart items correctly for product WITH variations', async () => {
        const mockVariationId = 'VAR-1';
        
        // Setup mock data
        const orderData = {
            userId: mockUserId,
            addressId: mockAddressId,
            orderItems: [
                { productId: mockProductId, variationId: mockVariationId, quantity: 1 }
            ],
            paymentMethod: 'COD'
        };

        // Mock address validation
        prisma.address.findFirst.mockResolvedValue({ id: mockAddressId });

        // Mock product lookup (WITH variations)
        prisma.product.findMany.mockResolvedValue([
            {
                id: mockProductId,
                price: 100,
                storeId: 'store1',
                inStock: true,
                variation_matrix: [
                    { sku: mockVariationId, price: 120, stock: 10 }
                ]
            }
        ]);

        // Mock product lookup for transaction (findUnique)
        prisma.product.findUnique.mockResolvedValue({
            id: mockProductId,
            price: 100,
            storeId: 'store1',
            inStock: true,
            variation_matrix: [
                { sku: mockVariationId, price: 120, stock: 10 }
            ]
        });

        // Mock cart lookup
        prisma.cart.findUnique.mockResolvedValue({ id: mockCartId });

        // Mock order creation
        prisma.order.create.mockResolvedValue({
            id: 'order1',
            storeId: 'store1',
            orderItems: []
        });

        // Execute
        await createOrder(orderData);

        // Verify cleanup
        expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
            where: {
                cartId: mockCartId,
                OR: [
                    { productId: mockProductId, variationId: mockVariationId }
                ]
            }
        });
    });

    test('should force variationId to null for non-variable product even if provided', async () => {
        // Setup mock data with garbage variationId
        const orderData = {
            userId: mockUserId,
            addressId: mockAddressId,
            orderItems: [
                { productId: mockProductId, variationId: 'undefined', quantity: 1 }
            ],
            paymentMethod: 'COD'
        };

        // Mock address validation
        prisma.address.findFirst.mockResolvedValue({ id: mockAddressId });

        // Mock product lookup (NO variations)
        prisma.product.findMany.mockResolvedValue([
            {
                id: mockProductId,
                price: 100,
                storeId: 'store1',
                inStock: true,
                variation_matrix: [] // Empty matrix
            }
        ]);
        
        // Mock product lookup for transaction (findUnique)
        prisma.product.findUnique.mockResolvedValue({
            id: mockProductId,
            price: 100,
            storeId: 'store1',
            inStock: true,
            variation_matrix: [],
            stock: 10
        });

        // Mock cart lookup
        prisma.cart.findUnique.mockResolvedValue({ id: mockCartId });

        // Mock order creation
        prisma.order.create.mockResolvedValue({
            id: 'order1',
            storeId: 'store1',
            orderItems: []
        });

        // Execute
        await createOrder(orderData);

        // Verify cleanup - should use null because product has no variations
        expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
            where: {
                cartId: mockCartId,
                OR: [
                    { 
                        productId: mockProductId,
                        OR: [
                            { variationId: null },
                            { variationId: '' }
                        ]
                    }
                ]
            }
        });
    });

    test('should clean up mixed cart items (variant + non-variant) correctly', async () => {
        const productA = 'prodA'; // Has variants
        const productB = 'prodB'; // No variants
        const variantA = 'VAR-A';

        // Setup mock data
        const orderData = {
            userId: mockUserId,
            addressId: mockAddressId,
            orderItems: [
                { productId: productA, variationId: variantA, quantity: 1 },
                { productId: productB, variationId: undefined, quantity: 1 }
            ],
            paymentMethod: 'COD'
        };

        // Mock address validation
        prisma.address.findFirst.mockResolvedValue({ id: mockAddressId });

        // Mock product lookup
        prisma.product.findMany.mockResolvedValue([
            {
                id: productA,
                price: 100,
                storeId: 'store1',
                inStock: true,
                variation_matrix: [{ sku: variantA, price: 120, stock: 10 }]
            },
            {
                id: productB,
                price: 50,
                storeId: 'store1',
                inStock: true,
                variation_matrix: [] // Empty matrix
            }
        ]);

        // Mock product lookup for transaction (findUnique)
        prisma.product.findUnique
            .mockResolvedValueOnce({
                id: productA,
                price: 100,
                storeId: 'store1',
                inStock: true,
                variation_matrix: [{ sku: variantA, price: 120, stock: 10 }],
                stock: 10
            })
            .mockResolvedValueOnce({
                id: productB,
                price: 50,
                storeId: 'store1',
                inStock: true,
                variation_matrix: [], // Empty matrix
                stock: 10
            });

        // Mock cart lookup
        prisma.cart.findUnique.mockResolvedValue({ id: mockCartId });

        // Mock order creation
        prisma.order.create.mockResolvedValue({
            id: 'order_mixed',
            storeId: 'store1',
            orderItems: []
        });

        // Execute
        await createOrder(orderData);

        // Verify cleanup
        expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
            where: {
                cartId: mockCartId,
                OR: [
                    { productId: productA, variationId: variantA },
                    { 
                        productId: productB,
                        OR: [
                            { variationId: null },
                            { variationId: '' }
                        ]
                    }
                ]
            }
        });
    });
});
