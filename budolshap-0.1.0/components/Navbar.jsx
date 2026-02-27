'use client'
import { Search, ShoppingCart, LogOut, User, ChevronDown, LayoutDashboard, Store, ShoppingBag, Shield, LogIn, UserPlus, Loader2, Menu, X, ShieldCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@/context/AuthContext";
import { useAuthUI } from "@/context/AuthUIContext";
import { useSearch } from "@/context/SearchContext";
import { clearCart } from "@/lib/features/cart/cartSlice";

import { useRealtimeBuyerOrders } from "@/hooks/useRealtimeBuyerOrders";
import { useRealtimeUser } from "@/hooks/useRealtimeUser";
import { useCallback } from "react";
import BudolPayText from '@/components/payment/BudolPayText';

// ... existing imports

const Navbar = () => {

    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useDispatch();
    const { user, logout, role } = useAuth();
    const { showLogin, showRegister } = useAuthUI();
    const { searchQuery, updateSearchQuery, placeholder } = useSearch();

    const [isAdmin, setIsAdmin] = useState(false)
    const [isSeller, setIsSeller] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
    const [storeLogo, setStoreLogo] = useState(null)
    const [storeStatus, setStoreStatus] = useState(null)
    const cartCount = useSelector(state => state.cart.total)
    const cartItems = useSelector(state => state.cart.cartItems)
    const menuRef = useRef(null)
    const mobileMenuRef = useRef(null)
    const mobileSearchInputRef = useRef(null)
    const [mounted, setMounted] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    // Fetch order count
    const { pagination } = useRealtimeBuyerOrders({
        userId: user?.id,
        limit: 1 // We only need the total count
    });
    const orderCount = pagination?.total || 0;

    useEffect(() => {
        setMounted(true)
    }, [])

    // Close menus when pathname changes (standard Next.js behavior)
    useEffect(() => {
        setShowUserMenu(false);
        setIsMobileMenuOpen(false);
        setIsMobileSearchOpen(false);
    }, [pathname]);

    const fetchStore = useCallback(async () => {
        if (!user) {
            setIsSeller(false);
            setStoreStatus(null);
            setStoreLogo(null);
            return;
        }

        try {
            const res = await fetch(`/api/stores/user/${user.id}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.id) {
                    setIsSeller(true);
                    setStoreStatus(data.status);
                    if (data.logo) {
                        setStoreLogo(data.logo);
                    }
                } else {
                    setIsSeller(false);
                    setStoreStatus(null);
                    setStoreLogo(null);
                }
            } else {
                setIsSeller(false);
                setStoreStatus(null);
                setStoreLogo(null);
            }
        } catch (error) {
            console.error('[Navbar] Failed to fetch store:', error);
            setIsSeller(false);
            setStoreStatus(null);
            setStoreLogo(null);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user) {
            // Check if user is admin
            setIsAdmin(role === 'ADMIN' || user.isAdmin);
            fetchStore();
        } else {
            setIsAdmin(false);
            setIsSeller(false);
            setStoreStatus(null);
            setStoreLogo(null);
        }
    }, [user, role, fetchStore])

    // Reactive Updates for Navbar
    useEffect(() => {
        const handleUpdates = () => {
            console.log('[Navbar] Global update event received, refreshing store logo...');
            fetchStore();
        };

        window.addEventListener('login-success', handleUpdates);
        window.addEventListener('store-updated', handleUpdates);
        return () => {
            window.removeEventListener('login-success', handleUpdates);
            window.removeEventListener('store-updated', handleUpdates);
        };
    }, [fetchStore]);

    // Handle user-specific realtime events (like store status updates)
    const handleUserEvent = useCallback((event, data) => {
        if (event === 'store-status-updated' && data) {
            if (typeof data.status === 'string') {
                const normalizedStatus = data.status.toLowerCase()
                setStoreStatus(normalizedStatus)
                if (!isAdmin) {
                    setIsSeller(normalizedStatus === 'approved')
                }
            }
            if (typeof data.isActive === 'boolean') {
                setIsSeller(data.isActive)
            }
        }
    }, [isAdmin]);

    useRealtimeUser({
        userId: user?.id,
        onEvent: handleUserEvent
    });

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedInsideDesktop = menuRef.current && menuRef.current.contains(event.target)
            const clickedInsideMobile = mobileMenuRef.current && mobileMenuRef.current.contains(event.target)

            if (!clickedInsideDesktop && !clickedInsideMobile) {
                setShowUserMenu(false)
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        const trimmedQuery = searchQuery.trim()
        if (trimmedQuery) {
            router.push(`/shop?search=${encodeURIComponent(trimmedQuery)}`)
        } else {
            router.push('/shop')
        }
    }

    const handleMobileSearchSubmit = (e) => {
        e.preventDefault()
        handleSearch(e)
        setIsMobileSearchOpen(false)
    }

    const handleLogout = async () => {
        setIsLoggingOut(true);

        // Artificial delay ensuring spinner visibility for UX
        const minDelay = new Promise(resolve => setTimeout(resolve, 800));

        // Force sync cart to server before logging out
    const syncCartPromise = (async () => {
        if (user && cartItems && Object.keys(cartItems).length > 0) {
            console.log('Syncing cart before logout:', cartItems);
                try {
                    const response = await fetch('/api/cart', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id, cart: cartItems }),
                        // keepalive: true // Temporarily disable to see if it affects the 500 error
                    });
                    if (!response.ok) {
                        throw new Error(`Sync failed with status: ${response.status}`);
                    }
                    console.log('Cart synced successfully before logout');
                } catch (error) {
                    console.error("Failed to sync cart on logout:", error);
                }
            }
        })();

        // Wait for both the minimum delay and the cart sync
        await Promise.all([minDelay, syncCartPromise]);

        // Clear marketing ad session data on logout
        sessionStorage.removeItem('last_ad_index');
        sessionStorage.removeItem('dismissed_ads');

        await logout(); // Ensure logout completes and userId becomes null
        
        // NOTE: Cart clearing is now handled in PublicLayout.jsx when it detects userId transition to null.
        // This prevents race conditions where an empty cart might be synced to the server.
        // dispatch(clearCart());
        // localStorage.removeItem('budolshap_cart');
        
        setShowUserMenu(false);
        setIsLoggingOut(false);

    }

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        if (isMobileSearchOpen) {
            mobileSearchInputRef.current?.focus()
        }
    }, [isMobileSearchOpen])

    return (
        <nav className="relative bg-white z-[1000] border-b border-green-100 shadow-sm">
            <div className="mx-4 sm:mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-3 sm:py-4 transition-all">

                    {/* Logo */}
                    <Link href="/" className="relative shrink-0 flex items-center">
                        <img
                            src="https://res.cloudinary.com/dasfwpg7x/image/upload/v1772205112/budolshap/assets/budolshap_logo_bag_trans.png"
                            alt="budolShap"
                            className="h-10 w-auto select-none sm:hidden"
                            draggable="false"
                        />
                        <img
                            src="https://res.cloudinary.com/dasfwpg7x/image/upload/v1771164945/budolshap/assets/budolshap_logo_transparent.png"
                            alt="budolShap"
                            className="hidden sm:block h-12 sm:h-16 lg:h-20 w-auto select-none"
                            draggable="false"
                        />
                        {(isAdmin || isSeller || user?.isCoopMember || user?.isMember) && (
                            <p
                                className={`hidden sm:flex absolute text-[9px] sm:text-[10px] font-semibold top-3 sm:top-3 -right-3 sm:-right-4 px-1 sm:px-2 py-0.5 rounded-full items-center gap-1 text-white ${isAdmin ? 'bg-red-500' : isSeller ? 'bg-purple-500' : user?.isCoopMember ? 'bg-blue-500' : 'bg-green-500'}`}
                            >
                                {isAdmin ? 'Admin' : isSeller ? 'Seller' : user?.isCoopMember ? 'Coop' : 'Plus'}
                            </p>
                        )}
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center gap-4 lg:gap-8 text-slate-600">
                        <Link href="/" className={`transition-colors ${pathname === '/' ? 'text-green-600 font-semibold' : 'hover:text-slate-900'}`}>Home</Link>
                        <Link href="/shop" className={`transition-colors ${pathname === '/shop' ? 'text-green-600 font-semibold' : 'hover:text-slate-900'}`}>Shop</Link>
                        <Link href="/under-construction" className={`transition-colors ${pathname === '/under-construction' ? 'text-green-600 font-semibold' : 'hover:text-slate-900'}`}>About</Link>
                        <Link href="/under-construction" className={`transition-colors ${pathname === '/under-construction' ? 'text-green-600 font-semibold' : 'hover:text-slate-900'}`}>Contact</Link>

                        <form onSubmit={handleSearch} className="hidden lg:flex items-center w-72 text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full">
                            <Search size={18} className="text-slate-600" />
                            <input suppressHydrationWarning className="w-full bg-transparent outline-none placeholder-slate-600" type="text" placeholder={placeholder} value={searchQuery} onChange={(e) => updateSearchQuery(e.target.value)} required />
                        </form>

                        <div className="flex items-center gap-3">
                            <Link href="/cart" className="relative flex items-center gap-2 text-slate-600">
                                <ShoppingCart size={22} />
                                <button suppressHydrationWarning className="absolute -top-1 -right-1 text-[8px] text-white bg-slate-600 size-3.5 rounded-full">{cartCount}</button>
                            </Link>

                            <Link href="/orders" className="group relative flex items-center gap-2 text-slate-600">
                                <ShoppingBag size={22} />
                                {orderCount > 0 && (
                                    <button suppressHydrationWarning className="absolute -top-1 -right-1 text-[8px] text-white bg-slate-600 size-3.5 rounded-full">{orderCount}</button>
                                )}
                                {/* Tooltip */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                    <div className="relative px-3 py-1.5 text-xs font-medium text-white bg-slate-800 rounded-md shadow-xl whitespace-nowrap">
                                        My Orders
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {mounted && user ? (
                            <div className="flex items-center gap-3 relative" ref={menuRef}>
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 px-3 py-2 rounded-md hover:bg-slate-100 transition"
                                >
                                    {user.image ? (
                                        <img src={user.image} alt="Profile" className="w-5 h-5 rounded-full object-cover" />
                                    ) : isSeller && storeLogo ? (
                                        <img src={storeLogo} alt="Store Logo" className="w-5 h-5 rounded-full object-cover" />
                                    ) : (
                                        <User size={18} />
                                    )}
                                    <span>{user.name || user.phoneNumber || 'Guest'}</span>
                                    <ChevronDown size={16} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {/* User Dropdown Menu */}
                                {showUserMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-max min-w-[14rem] bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-[1000] whitespace-nowrap">
                                        <div className="px-4 py-2 border-b border-slate-200">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-slate-800">{user.name || user.phoneNumber || 'Guest'}</p>
                                                {isAdmin && (
                                                    <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-600 rounded-full font-medium">Admin</span>
                                                )}
                                                {isSeller && !isAdmin && (
                                                    <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${storeStatus === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-purple-100 text-purple-600'
                                                        }`}>
                                                        {storeStatus === 'pending' ? 'Pending' : 'Seller'}
                                                    </span>
                                                )}
                                            </div>
                                            {user.email && !user.email.includes('@quick.budolpay.com') && (
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            )}
                                        </div>

                                        {/* Admin Menu */}
                                        {isAdmin && (
                                            <>
                                                <Link
                                                    href="/admin"
                                                    className={`flex items-center gap-3 px-4 py-2 transition ${pathname === '/admin' ? 'bg-red-50 text-red-600 font-semibold' : 'text-slate-700 hover:bg-red-50 hover:text-red-600'}`}
                                                >
                                                    <Shield size={18} className={pathname === '/admin' ? 'text-red-600' : 'text-red-500'} />
                                                    <span>Admin Dashboard</span>
                                                </Link>
                                                <Link
                                                    href="/admin/stores"
                                                    className={`flex items-center gap-3 px-4 py-2 transition text-sm ${pathname === '/admin/stores' ? 'bg-red-50 text-red-600 font-semibold' : 'text-slate-700 hover:bg-red-50 hover:text-red-600'}`}
                                                >
                                                    <span className="ml-9">Manage Stores</span>
                                                </Link>
                                                <Link
                                                    href="/admin/approve"
                                                    className={`flex items-center gap-3 px-4 py-2 transition text-sm ${pathname === '/admin/approve' ? 'bg-red-50 text-red-600 font-semibold' : 'text-slate-700 hover:bg-red-50 hover:text-red-600'}`}
                                                >
                                                    <span className="ml-9">Approve Stores</span>
                                                </Link>
                                                <Link
                                                    href="/admin/coupons"
                                                    className={`flex items-center gap-3 px-4 py-2 transition text-sm ${pathname === '/admin/coupons' ? 'bg-red-50 text-red-600 font-semibold' : 'text-slate-700 hover:bg-red-50 hover:text-red-600'}`}
                                                >
                                                    <span className="ml-9">Manage Coupons</span>
                                                </Link>
                                                <Link
                                                    href="/admin/memberships"
                                                    className={`flex items-center gap-3 px-4 py-2 transition text-sm ${pathname === '/admin/memberships' ? 'bg-red-50 text-red-600 font-semibold' : 'text-slate-700 hover:bg-red-50 hover:text-red-600'}`}
                                                >
                                                    <span className="ml-9">Membership Applications</span>
                                                </Link>
                                                <div className="my-1 border-t border-slate-200"></div>
                                            </>
                                        )}

                                        {/* Seller Menu */}
                                        {isSeller && (
                                            <>
                                                <Link
                                                    href="/store"
                                                    className={`flex items-center gap-3 px-4 py-2 transition ${pathname === '/store' ? 'bg-green-50 text-green-600 font-semibold' : 'text-slate-700 hover:bg-green-50 hover:text-green-600'}`}
                                                >
                                                    <Store size={18} className={pathname === '/store' ? 'text-green-600' : 'text-green-500'} />
                                                    <span>Store Dashboard</span>
                                                </Link>
                                                {storeStatus !== 'pending' && (
                                                    <>
                                                        <Link
                                                            href="/store/add-product"
                                                            className={`flex items-center gap-3 px-4 py-2 transition text-sm ${pathname === '/store/add-product' ? 'bg-green-100/50 text-green-700 font-semibold' : 'text-slate-700 hover:bg-green-50 hover:text-green-600'}`}
                                                        >
                                                            <span className="ml-9">Add Product</span>
                                                        </Link>
                                                        <Link
                                                            href="/store/manage-product"
                                                            className={`flex items-center gap-3 px-4 py-2 transition text-sm ${pathname === '/store/manage-product' ? 'bg-green-100/50 text-green-700 font-semibold' : 'text-slate-700 hover:bg-green-50 hover:text-green-600'}`}
                                                        >
                                                            <span className="ml-9">Manage Products</span>
                                                        </Link>
                                                        <Link
                                                            href="/store/orders"
                                                            className={`flex items-center gap-3 px-4 py-2 transition text-sm ${pathname === '/store/orders' ? 'bg-green-100/50 text-green-700 font-semibold' : 'text-slate-700 hover:bg-green-50 hover:text-green-600'}`}
                                                        >
                                                            <span className="ml-9">Store Orders</span>
                                                        </Link>
                                                    </>
                                                )}
                                                <div className="my-1 border-t border-slate-200"></div>
                                            </>
                                        )}

                                        {/* Regular User Menu */}
                                        <Link
                                            href="/orders"
                                            className={`flex items-center gap-3 px-4 py-2 transition ${pathname === '/orders' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            <ShoppingBag size={18} />
                                            <span>My Orders</span>
                                        </Link>

                                        {/* My Profile Link */}
                                        <Link
                                            href="/profile"
                                            className={`flex items-center gap-3 px-4 py-2 transition ${pathname === '/profile' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            <User size={18} />
                                            <span>My Profile</span>
                                        </Link>

                                        {/* Become A Seller - Only for buyers or pending sellers */}
                                        {(!isSeller || storeStatus !== 'approved') && (
                                            <Link
                                                href="/create-store"
                                                className={`flex items-center gap-3 px-4 py-2 transition ${pathname === '/create-store' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'}`}
                                            >
                                                <Store size={18} className={pathname === '/create-store' ? 'text-blue-600' : 'text-blue-500'} />
                                                <span>Become A Seller</span>
                                            </Link>
                                        )}

                                        <div className="my-1 border-t border-slate-200"></div>

                                        {/* Logout */}
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition"
                                        >
                                            <LogOut size={18} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 transition text-white rounded-full"
                                >
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </div>
                        ) : mounted && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => showLogin()}
                                    className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => showRegister()}
                                    className="px-6 py-2 bg-white border border-indigo-500 text-indigo-500 hover:bg-indigo-50 transition rounded-full"
                                >
                                    Sign Up
                                </button>
                            </div>
                        )}

                    </div>

                    {/* Mobile Header Actions */}
                    <div className="lg:hidden flex items-center gap-2">
                        {isMobileSearchOpen ? (
                            <form onSubmit={handleMobileSearchSubmit} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-full focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 w-[42vw] max-w-[210px] sm:w-[48vw] sm:max-w-[240px] min-w-0">
                                <Search size={16} className="text-slate-500" />
                                <input
                                    ref={mobileSearchInputRef}
                                    className="w-full bg-transparent outline-none placeholder-slate-400 text-sm"
                                    type="text"
                                    placeholder={placeholder}
                                    value={searchQuery}
                                    onChange={(e) => updateSearchQuery(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsMobileSearchOpen(false)}
                                    className="text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </form>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsMobileSearchOpen(true)}
                                className="text-slate-600 p-1"
                            >
                                <Search size={22} />
                            </button>
                        )}

                        <Link href="/cart" className="relative text-slate-600 p-1">
                            <ShoppingCart size={22} />
                            <button className="absolute -top-0 -right-0 text-[8px] text-white bg-slate-600 size-3.5 rounded-full">{cartCount}</button>
                        </Link>

                        <Link href="/orders" className="relative text-slate-600 p-1">
                            <ShoppingBag size={22} />
                            {orderCount > 0 && (
                                <button className="absolute -top-0 -right-0 text-[8px] text-white bg-slate-600 size-3.5 rounded-full">{orderCount}</button>
                            )}
                        </Link>

                        <button
                            onClick={() => {
                                setIsMobileSearchOpen(false)
                                setIsMobileMenuOpen(true)
                            }}
                            className="text-slate-700 p-1"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Drawer Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[2000] lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>

                    {/* Drawer */}
                    <div className="absolute top-0 right-0 h-full w-[85%] max-w-[320px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-50">
                            <h2 className="text-xl font-semibold text-slate-800">Menu</h2>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-slate-400 hover:text-slate-800 transition-colors"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">

                            {/* Mobile User Profile Header */}
                            {mounted && user && (
                                <div className="mb-6 pb-6 border-b border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                                            {user.image ? (
                                                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                                            ) : isSeller && storeLogo ? (
                                                <img src={storeLogo} alt="Store Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={24} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 text-lg truncate leading-tight flex items-center gap-2">
                                                <span className="truncate">{user.name || user.phoneNumber || 'Guest'}</span>
                                                {(isAdmin || isSeller || user?.isCoopMember || user?.isMember) && (
                                                    <span className={`inline-flex sm:hidden text-[10px] px-2 py-0.5 rounded-full text-white whitespace-nowrap ${isAdmin ? 'bg-red-500' : isSeller ? 'bg-purple-500' : user?.isCoopMember ? 'bg-blue-500' : 'bg-green-500'}`}>
                                                        {isAdmin ? 'Admin' : isSeller ? 'Seller' : user?.isCoopMember ? 'Coop' : 'Plus'}
                                                    </span>
                                                )}
                                            </p>
                                            {user.email && !user.email.includes('@quick.budolpay.com') && (
                                                <p className="text-sm text-slate-400 truncate">{user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Nav Links */}
                            <div className="flex flex-col gap-6 py-4">
                                <Link href="/" className={`text-lg font-medium transition-colors ${pathname === '/' ? 'text-green-600' : 'text-slate-700 hover:text-green-600'}`}>Home</Link>
                                <Link href="/shop" className={`text-lg font-medium transition-colors ${pathname === '/shop' ? 'text-green-600' : 'text-slate-700 hover:text-green-600'}`}>Shop</Link>
                                <Link href="/under-construction" className={`text-lg font-medium transition-colors ${pathname === '/under-construction' ? 'text-green-600' : 'text-slate-700 hover:text-green-600'}`}>About</Link>
                                <Link href="/under-construction" className={`text-lg font-medium transition-colors ${pathname === '/under-construction' ? 'text-green-600' : 'text-slate-700 hover:text-green-600'}`}>Contact</Link>
                            </div>

                            <div className="my-2 border-t border-slate-100"></div>

                            {/* Auth/User Links */}
                            {mounted && user ? (
                                <div className="flex flex-col">
                                    <div className="py-4">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">MY ACCOUNT</p>

                                        <div className="flex flex-col gap-5">
                                            <Link href="/orders" className={`flex items-center gap-4 transition-colors group ${pathname === '/orders' ? 'text-green-600' : 'text-slate-700 hover:text-green-600'}`}>
                                                <div className={`p-2 rounded-lg transition-colors ${pathname === '/orders' ? 'bg-green-100 text-green-600 shadow-sm' : 'bg-slate-50 group-hover:bg-green-50 text-slate-600 group-hover:text-green-600'}`}>
                                                    <ShoppingBag size={20} />
                                                </div>
                                                <span className={`text-base font-semibold ${pathname === '/orders' ? 'text-green-600' : 'font-medium'}`}>My Orders</span>
                                            </Link>

                                            {/* Mobile Profile Link */}
                                            <Link href="/profile" className={`flex items-center gap-4 transition-colors group ${pathname === '/profile' ? 'text-green-600' : 'text-slate-700 hover:text-green-600'}`}>
                                                <div className={`p-2 rounded-lg transition-colors ${pathname === '/profile' ? 'bg-green-100 text-green-600 shadow-sm' : 'bg-slate-50 group-hover:bg-green-50 text-slate-600 group-hover:text-green-600'}`}>
                                                    <User size={20} />
                                                </div>
                                                <span className={`text-base font-semibold ${pathname === '/profile' ? 'text-green-600' : 'font-medium'}`}>My Profile</span>
                                            </Link>

                                            {(!isSeller || storeStatus !== 'approved') && (
                                                <Link href="/create-store" className={`flex items-center gap-4 transition-colors group ${pathname === '/create-store' ? 'text-blue-600' : 'text-slate-700 hover:text-green-600'}`}>
                                                    <div className={`p-2 rounded-lg transition-colors ${pathname === '/create-store' ? 'bg-blue-100 text-blue-600 shadow-sm' : 'bg-slate-50 group-hover:bg-green-50 text-slate-600 group-hover:text-green-600'}`}>
                                                        <Store size={20} />
                                                    </div>
                                                    <span className={`text-base font-semibold ${pathname === '/create-store' ? 'text-blue-600' : 'font-medium'}`}>Become a Seller</span>
                                                </Link>
                                            )}

                                            {/* Admin Dashboard if applicable */}
                                            {isAdmin && (
                                                <Link href="/admin" className={`flex items-center gap-4 transition-colors group ${pathname === '/admin' ? 'text-red-600' : 'text-slate-700 hover:text-red-600'}`}>
                                                    <div className={`p-2 rounded-lg transition-colors ${pathname === '/admin' ? 'bg-red-100 text-red-600 shadow-sm font-semibold' : 'bg-red-50 group-hover:bg-red-100 text-red-500'}`}>
                                                        <Shield size={20} />
                                                    </div>
                                                    <span className={`text-base font-semibold ${pathname === '/admin' ? 'text-red-600' : 'font-medium'}`}>Admin Dashboard</span>
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-4 text-red-600 hover:text-red-700 transition-colors font-semibold group py-2"
                                        >
                                            <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                                                <LogOut size={20} />
                                            </div>
                                            <span className="text-lg">Logout</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 mt-6">
                                    <button
                                        onClick={() => { showLogin(); setIsMobileMenuOpen(false); }}
                                        className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-100 active:scale-95 transition-all text-base"
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => { showRegister(); setIsMobileMenuOpen(false); }}
                                        className="w-full py-3.5 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold active:scale-95 transition-all text-base"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {/* Full-Screen Logout Spinner */}
            {isLoggingOut && (
                <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 animate-scaleIn">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                        <p className="text-white font-medium text-lg animate-pulse">Logging out...</p>
                    </div>
                </div>
            )}
        </nav>
    )
}

export default Navbar
