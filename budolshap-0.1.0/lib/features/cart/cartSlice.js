import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
        // WHY: Start as false so the cart page never hangs on a spinner for
        // guests or users with cleared site data. The layout sets isLoading=true
        // explicitly before starting a server fetch, and setCart/setCartLoading(false)
        // resolves it. Defaulting to true caused infinite spinners when the
        // setCartLoading(false) dispatch raced against component rendering.
        isLoading: false,
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId, variationId, quantity = 1 } = action.payload
            const itemKey = variationId ? `${productId}_${variationId}` : productId;
            const qtyToAdd = parseInt(quantity) || 1;
            
            if (state.cartItems[itemKey]) {
                state.cartItems[itemKey] = (parseInt(state.cartItems[itemKey]) || 0) + qtyToAdd;
            } else {
                state.cartItems[itemKey] = qtyToAdd;
            }
            state.total = Object.values(state.cartItems).reduce((a, b) => a + (parseInt(b) || 0), 0)
        },
        removeFromCart: (state, action) => {
            const { productId, variationId } = action.payload
            const itemKey = variationId ? `${productId}_${variationId}` : productId;
            
            if (state.cartItems[itemKey]) {
                const currentQty = parseInt(state.cartItems[itemKey]) || 0;
                if (currentQty > 0) {
                    state.cartItems[itemKey] = currentQty - 1;
                    if (state.cartItems[itemKey] === 0) {
                        delete state.cartItems[itemKey]
                    }
                }
            }
            state.total = Object.values(state.cartItems).reduce((a, b) => a + (parseInt(b) || 0), 0)
        },
        deleteItemFromCart: (state, action) => {
            const { productId, variationId } = action.payload
            const itemKey = variationId ? `${productId}_${variationId}` : productId;
            
            delete state.cartItems[itemKey]
            state.total = Object.values(state.cartItems).reduce((a, b) => a + (parseInt(b) || 0), 0)
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        },
        setCart: (state, action) => {
            // Ensure all values are numbers
            const items = action.payload || {};
            const cleanItems = {};
            let total = 0;
            
            Object.keys(items).forEach(key => {
                const qty = parseInt(items[key]) || 0;
                if (qty > 0) {
                    cleanItems[key] = qty;
                    total += qty;
                }
            });

            state.cartItems = cleanItems;
            state.total = total;
            state.isLoading = false
        },
        setCartLoading: (state, action) => {
            state.isLoading = action.payload
        },
        updateCartQuantity: (state, action) => {
            const { productId, variationId, quantity } = action.payload;
            const itemKey = variationId ? `${productId}_${variationId}` : productId;
            const newQuantity = Math.max(0, parseInt(quantity) || 0);

            if (newQuantity === 0) {
                delete state.cartItems[itemKey];
            } else {
                state.cartItems[itemKey] = newQuantity;
            }

            state.total = Object.values(state.cartItems).reduce((a, b) => a + (parseInt(b) || 0), 0)
        }
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart, setCart, setCartLoading, updateCartQuantity } = cartSlice.actions

export default cartSlice.reducer
