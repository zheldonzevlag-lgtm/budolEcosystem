
describe('Cart Cleanup Logic', () => {
    test('generates correct delete conditions for mixed variationIds', () => {
        // Simulation of order items coming from DB or request
        const orderItems = [
            { productId: 'p1', variationId: null },
            { productId: 'p2', variationId: '' },
            { productId: 'p3', variationId: 'var-123' },
            { productId: 'p4', variationId: undefined }
        ];

        // The logic implemented in the fix
        const cartCleanupConditions = orderItems.map(item => {
            // If variationId is null or empty, match both null and empty string in CartItem
            // This handles potential inconsistencies between empty string and null in DB
            if (!item.variationId) {
                return {
                    productId: item.productId,
                    OR: [
                        { variationId: null },
                        { variationId: '' }
                    ]
                };
            }
            // Otherwise match exactly
            return {
                productId: item.productId,
                variationId: item.variationId
            };
        });

        expect(cartCleanupConditions).toHaveLength(4);
        
        // Check p1 (null variation) -> Should match robustly
        expect(cartCleanupConditions[0]).toEqual({
            productId: 'p1',
            OR: [
                { variationId: null },
                { variationId: '' }
            ]
        });

        // Check p2 (empty string variation) -> Should match robustly
        expect(cartCleanupConditions[1]).toEqual({
            productId: 'p2',
            OR: [
                { variationId: null },
                { variationId: '' }
            ]
        });

        // Check p3 (valid variation) -> Should match exactly
        expect(cartCleanupConditions[2]).toEqual({
            productId: 'p3',
            variationId: 'var-123'
        });

        // Check p4 (undefined variation) -> Should match robustly
        expect(cartCleanupConditions[3]).toEqual({
            productId: 'p4',
            OR: [
                { variationId: null },
                { variationId: '' }
            ]
        });
    });
});
