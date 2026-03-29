'use client'
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MarketingAdPopup from "@/components/MarketingAdPopup";
import { usePathname } from "next/navigation";
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
    const pathname = usePathname();

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
                } else {
                    dispatch(setCartLoading(false));
                }
            } catch (e) {
                console.error('Failed to parse cart from LS', e);
                dispatch(setCartLoading(false));
            }
        } else {
            dispatch(setCartLoading(false));
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

    // Fetch cart when userId is available or when navigating (fallback)
    useEffect(() => {
        // WHY: If no userId (guest/cleared site data), cartSlice already starts at
        // isLoading=false, so the cart page immediately shows the empty state.
        // No spinner dispatch needed here.
        if (!userId) return;

        const fetchCart = async (isBackground = false) => {
            if (!isBackground) console.log('[Layout] Fetching cart for user:', userId);
            try {
                const response = await fetch(`/api/cart?userId=${userId}`);
                if (response.ok) {
                    const serverCart = await response.json();
                    
                    // If it's a background fetch (polling/nav), we prefer server state over local
                    // to resolve inconsistencies like "7 items in local but 0 in server"
                    if (isBackground) {
                        dispatch(setCart(serverCart));
                        setInitialLoadDone(true);
                        return;
                    }

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
                    // Resolve the loading state on a failed response so the UI doesn't hang
                    dispatch(setCartLoading(false));
                }
            } catch (error) {
                console.error("[Layout] Failed to fetch cart:", error);
                dispatch(setCartLoading(false));
                // Do NOT enable auto-sync on error
            }
        };

        // Background refresh on pathname change (same user); foreground fetch on new login
        const isBackground = prevUserIdRef.current === userId;
        
        if (!isBackground) {
            setInitialLoadDone(false);
            // WHY: Opt-in to loading spinner only when a real foreground fetch starts.
            // Since cartSlice starts at isLoading=false, guests/cleared-data sessions
            // never see a hanging spinner. We set true here only for logged-in users
            // so setCart() (which sets isLoading=false) properly resolves the spinner.
            dispatch(setCartLoading(true));
        }
        
        fetchCart(isBackground);
    }, [dispatch, userId, pathname]);

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
