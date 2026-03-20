'use client'
import { addToCart, removeFromCart, updateCartQuantity } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const Counter = ({ productId, variationId, max = 999 }) => {

    const { cartItems } = useSelector(state => state.cart);
    const itemKey = variationId ? `${productId}_${variationId}` : productId;

    const dispatch = useDispatch();

    const addToCartHandler = () => {
        const currentQty = cartItems[itemKey] || 0;
        if (currentQty < max) {
            dispatch(addToCart({ productId, variationId }))
        }
    }

    const removeFromCartHandler = () => {
        dispatch(removeFromCart({ productId, variationId }))
    }

    const onChangeHandler = (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) return;
        if (val < 1) val = 1;
        if (val > max) val = max;
        dispatch(updateCartQuantity({ productId, variationId, quantity: val }))
    }

    return (
        <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600">
            <button onClick={removeFromCartHandler} className="p-1 select-none cursor-pointer hover:bg-slate-100 rounded">-</button>
            <input
                type="number"
                value={cartItems[itemKey] ?? ''}
                onChange={onChangeHandler}
                className="w-12 text-center bg-transparent outline-none m-0 p-0 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none font-medium"
            />
            <button onClick={addToCartHandler} className="p-1 select-none cursor-pointer hover:bg-slate-100 rounded">+</button>
        </div>
    )
}

export default Counter