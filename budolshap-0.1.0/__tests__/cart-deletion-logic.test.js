import cartReducer, { addToCart, deleteItemFromCart, clearCart } from '../lib/features/cart/cartSlice';

describe('cartSlice - Cart Item Deletion Logic', () => {
    let initialState;

    beforeEach(() => {
        initialState = {
            total: 0,
            cartItems: {},
            isLoading: false,
        };
    });

    test('should add items correctly (Setup)', () => {
        let state = cartReducer(initialState, addToCart({ productId: 'p1', variationId: 'v1', quantity: 1 }));
        expect(state.cartItems['p1_v1']).toBe(1);
        expect(state.total).toBe(1);
    });

    test('should remove a specific item with variationId', () => {
        // Setup: Add two items
        let state = cartReducer(initialState, addToCart({ productId: 'p1', variationId: 'v1', quantity: 1 }));
        state = cartReducer(state, addToCart({ productId: 'p1', variationId: 'v2', quantity: 1 }));
        
        expect(state.cartItems['p1_v1']).toBe(1);
        expect(state.cartItems['p1_v2']).toBe(1);
        expect(state.total).toBe(2);

        // Action: Delete one item (p1_v1)
        state = cartReducer(state, deleteItemFromCart({ productId: 'p1', variationId: 'v1' }));

        // Assert
        expect(state.cartItems['p1_v1']).toBeUndefined(); // Deleted
        expect(state.cartItems['p1_v2']).toBe(1); // Should remain
        expect(state.total).toBe(1);
    });

    test('should remove a specific item without variationId', () => {
         // Setup: Add item without variation
        let state = cartReducer(initialState, addToCart({ productId: 'p2', quantity: 2 }));
        
        expect(state.cartItems['p2']).toBe(2);
        
        // Action: Delete item
        state = cartReducer(state, deleteItemFromCart({ productId: 'p2' }));

        // Assert
        expect(state.cartItems['p2']).toBeUndefined();
        expect(state.total).toBe(0);
    });

    test('should NOT remove unpurchased items when deleting purchased ones (Partial Payment Scenario)', () => {
        // This mimics the critical bug fix scenario
        // User has: 
        // 1. Product A (Var 1) - Selected for checkout
        // 2. Product A (Var 2) - Not selected
        // 3. Product B - Not selected
        
        let state = cartReducer(initialState, addToCart({ productId: 'A', variationId: '1', quantity: 1 }));
        state = cartReducer(state, addToCart({ productId: 'A', variationId: '2', quantity: 1 }));
        state = cartReducer(state, addToCart({ productId: 'B', quantity: 1 }));

        expect(Object.keys(state.cartItems)).toHaveLength(3);
        expect(state.total).toBe(3);

        // User purchases Product A (Var 1) ONLY
        // We dispatch deleteItemFromCart for A_1
        state = cartReducer(state, deleteItemFromCart({ productId: 'A', variationId: '1' }));

        // Assert
        expect(state.cartItems['A_1']).toBeUndefined(); // Should be gone
        expect(state.cartItems['A_2']).toBe(1); // Unpurchased variation MUST remain
        expect(state.cartItems['B']).toBe(1);   // Unpurchased product MUST remain
        expect(state.total).toBe(2);
    });

    test('should clear the entire cart when clearCart is called', () => {
        let state = cartReducer(initialState, addToCart({ productId: 'A', quantity: 1 }));
        state = cartReducer(state, addToCart({ productId: 'B', quantity: 1 }));

        state = cartReducer(state, clearCart());

        expect(Object.keys(state.cartItems)).toHaveLength(0);
        expect(state.total).toBe(0);
    });
});
