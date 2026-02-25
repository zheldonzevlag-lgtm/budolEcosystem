import cartReducer, { addToCart, removeFromCart, updateCartQuantity, deleteItemFromCart } from '../lib/features/cart/cartSlice';

describe('Cart Reducer with Variations', () => {
    const initialState = {
        total: 0,
        cartItems: {},
        isLoading: true,
    };

    test('should handle adding item without variation', () => {
        const action = addToCart({ productId: 'prod1' });
        const state = cartReducer(initialState, action);
        expect(state.cartItems['prod1']).toBe(1);
        expect(state.total).toBe(1);
    });

    test('should handle adding item with variation', () => {
        const action = addToCart({ productId: 'prod1', variationId: 'red_small' });
        const state = cartReducer(initialState, action);
        expect(state.cartItems['prod1_red_small']).toBe(1);
        expect(state.total).toBe(1);
    });

    test('should treat different variations as separate items', () => {
        let state = cartReducer(initialState, addToCart({ productId: 'prod1', variationId: 'red' }));
        state = cartReducer(state, addToCart({ productId: 'prod1', variationId: 'blue' }));
        
        expect(state.cartItems['prod1_red']).toBe(1);
        expect(state.cartItems['prod1_blue']).toBe(1);
        expect(state.total).toBe(2);
    });

    test('should increment quantity for same variation', () => {
        let state = cartReducer(initialState, addToCart({ productId: 'prod1', variationId: 'red' }));
        state = cartReducer(state, addToCart({ productId: 'prod1', variationId: 'red' }));
        
        expect(state.cartItems['prod1_red']).toBe(2);
        expect(state.total).toBe(2);
    });

    test('should handle removing item with variation', () => {
        let state = {
            total: 2,
            cartItems: { 'prod1_red': 2 },
            isLoading: false
        };
        const action = removeFromCart({ productId: 'prod1', variationId: 'red' });
        state = cartReducer(state, action);
        expect(state.cartItems['prod1_red']).toBe(1);
        expect(state.total).toBe(1);
    });

    test('should delete item with variation', () => {
        let state = {
            total: 5,
            cartItems: { 'prod1_red': 5 },
            isLoading: false
        };
        const action = deleteItemFromCart({ productId: 'prod1', variationId: 'red' });
        state = cartReducer(state, action);
        expect(state.cartItems['prod1_red']).toBeUndefined();
        expect(state.total).toBe(0);
    });

    test('should update quantity with variation', () => {
        let state = {
            total: 1,
            cartItems: { 'prod1_red': 1 },
            isLoading: false
        };
        const action = updateCartQuantity({ productId: 'prod1', variationId: 'red', quantity: 10 });
        state = cartReducer(state, action);
        expect(state.cartItems['prod1_red']).toBe(10);
        expect(state.total).toBe(10);
    });
});
