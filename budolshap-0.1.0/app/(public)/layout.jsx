'use client'
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MarketingAdPopup from "@/components/MarketingAdPopup";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setProduct } from "@/lib/features/product/productSlice";
import { setCart, setCartLoading, clearCart } from "@/lib/features/cart/cartSlice";
import { useAuth } from "@/context/AuthContext";

export default function PublicLayout({ children }) {
    const dispatch = useDispatch();
    const products = useSelector(state => state.product.list);
    const { cartItems } = useSelector(state => state.cart);
    const { user } = useAuth();
    const userId = user?.id;

    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const prevUserIdRef = useRef(userId);

    // Handle cart clearing on logout
    useEffect(() => {
        // If we had a user ID before, but now we don't, it means we logged out
        if (prevUserIdRef.current && !userId) {
            console.log('[Layout] User logged out, clearing cart state');
            dispatch(clearCart());
            // Ensure LS is cleared (though logout() usually handles it)
            localStorage.removeItem('budolshap_cart');
        }
        prevUserIdRef.current = userId;
    }, [userId, dispatch]);

    // Load cart from LocalStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('budolshap_cart');
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                if (parsed && typeof parsed === 'object') {
                    dispatch(setCart(parsed));
                }
            } catch (e) {
                console.error('Failed to parse cart from LS', e);
            }
        }
    }, [dispatch]);

    // Save cart to LocalStorage whenever it changes
    useEffect(() => {
        if (Object.keys(cartItems).length > 0) {
            localStorage.setItem('budolshap_cart', JSON.stringify(cartItems));
        } else {
            // Clear LocalStorage when cart is empty
            localStorage.removeItem('budolshap_cart');
        }
    }, [cartItems]);

    // Clear LS on logout is handled in the userId check below.

    // Keep track of latest cartItems for merging in async calls
    const cartItemsRef = useRef(cartItems);
    useEffect(() => {
        cartItemsRef.current = cartItems;
    }, [cartItems]);

    // Fetch products globally
    useEffect(() => {
        if (products.length === 0) {
            fetch('/api/products')
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then(data => {
                    if (Array.isArray(data)) {
                        dispatch(setProduct(data));
                    }
                })
                .catch(err => console.error('Failed to fetch products:', err));
        }
    }, [dispatch, products.length]);

    // Fetch cart when userId is available
    useEffect(() => {
        if (!userId) {
            // No user logged in.
            // If we just logged out, we should clear cart and LS.
            // But how do we distinguish "App Start (Guest)" from "Logout"?
            // App Start: userId is null. Cart might be loaded from LS (Guest Cart).
            // Logout: userId goes from 'abc' to null.

            // We can't easily distinguish here without previous state.
            // But usually, if userId is null, we just let the local cart be (Guest Mode).
            // We should NOT clear the cart here, because that wipes Guest Cart on reload!

            // PREVIOUS BUG: I was clearing cart on !userId.
            // This meant if I reload as guest, my cart is wiped?
            // No, because on reload, userId is null initially.
            // So "Load from LS" sets cart. Then this effect runs. !userId -> Clear Cart.
            // THIS WAS THE BUG FOR GUEST RELOAD TOO!

            // Fix: Don't clear cart if !userId. Just return.
            // But then how do we clear on logout?
            // Logout action should clear it.
            // In Navbar.jsx, logout() calls useAuth().logout().
            // In AuthContext, logout() clears token/user.
            // We should dispatch clearCart() in Navbar or AuthContext.
            // But AuthContext doesn't have dispatch.
            // Navbar has dispatch.

            // So, I will REMOVE the auto-clear here.
            // And I will rely on Navbar/Logout button to clear the cart state.

            return;
        }

        const fetchCart = async () => {
            console.log('[Layout] Fetching cart for user:', userId);
            try {
                const response = await fetch(`/api/cart?userId=${userId}`);
                if (response.ok) {
                    const serverCart = await response.json();
                    console.log('[Layout] Fetched server cart:', serverCart);

                    // Merge Logic
                    const localCart = cartItemsRef.current || {};
                    const mergedCart = { ...serverCart };

                    Object.keys(localCart).forEach(itemKey => {
                        if (mergedCart[itemKey]) {
                            // If item exists in both, use the larger quantity
                            mergedCart[itemKey] = Math.max(Number(mergedCart[itemKey] || 0), Number(localCart[itemKey] || 0));
                        } else {
                            mergedCart[itemKey] = localCart[itemKey];
                        }
                    });

                    console.log('[Layout] Merged cart:', mergedCart);
                    dispatch(setCart(mergedCart));
                    setInitialLoadDone(true);
                } else {
                    console.error('[Layout] Failed to fetch cart, status:', response.status);
                    // Do NOT enable auto-sync if fetch failed to avoid overwriting server data with empty state
                }
            } catch (error) {
                console.error("[Layout] Failed to fetch cart:", error);
                dispatch(setCartLoading(false));
                // Do NOT enable auto-sync on error
            }
        };

        // Reset initialLoadDone before fetching
        setInitialLoadDone(false);
        fetchCart();
    }, [dispatch, userId]);

    // Sync cart to server after initial load
    useEffect(() => {
        if (!userId || !initialLoadDone) return;

        const syncCart = async () => {
            // console.log('[Layout] Syncing cart to server:', cartItems);
            try {
                await fetch('/api/cart', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, cart: cartItems })
                });
            } catch (error) {
                console.error('[Layout] Failed to sync cart:', error);
            }
        };

        const timeoutId = setTimeout(() => {
            syncCart();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [userId, cartItems, initialLoadDone]);

    return (
        <>
            <MarketingAdPopup />
            <Banner />
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
