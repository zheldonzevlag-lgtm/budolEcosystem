import { createSlice } from '@reduxjs/toolkit'
const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: [],
        isLoading: true,
    },
    reducers: {
        setLoading: (state, action) => {
            state.isLoading = action.payload
        },
        setProduct: (state, action) => {
            state.list = Array.isArray(action.payload) ? action.payload : []
            state.isLoading = false
        },
        addProduct: (state, action) => {
            state.list.unshift(action.payload)
        },
        clearProduct: (state) => {
            state.list = []
        },
        updateProduct: (state, action) => {
            const index = state.list.findIndex(p => p.id === action.payload.id)
            if (index !== -1) {
                state.list[index] = { ...state.list[index], ...action.payload }
            }
        }
    }
})

export const { setProduct, addProduct, clearProduct, updateProduct, setLoading } = productSlice.actions

export default productSlice.reducer