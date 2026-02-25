'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { getUser, getToken, logout as logoutService, getCurrentUser, setAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuthUI } from './AuthUIContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { showLogin } = useAuthUI();

    useEffect(() => {
        // Listen for login success events from the UI
        const handleLoginSuccess = () => {
            console.log('[AuthContext] Login success detected, refreshing session...');
            loadUser();
        };
        window.addEventListener('login-success', handleLoginSuccess);
        return () => window.removeEventListener('login-success', handleLoginSuccess);
    }, []);

    const loadUser = async () => {
        // Use the centralized getToken utility
        const storedToken = getToken();
        const storedUser = getUser();
        
        console.log('[AuthContext] loadUser starting. storedUser:', storedUser?.email, 'storedToken present:', !!storedToken);

        if (storedToken) {
            console.log('[AuthContext] Setting initial token from storage');
            setToken(storedToken);
            if (storedUser) {
                console.log('[AuthContext] Setting initial user from storage');
                setUser(storedUser);
            }
        }

        if (!storedUser || !storedToken) {
            console.log('[AuthContext] No stored session found, setting isLoading=true');
            setIsLoading(true);
        }
            
        // Handle token from URL (SSO Callback) - fallback if cookie didn't work
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const urlToken = urlParams.get('token');
            if (urlToken && urlToken !== storedToken) {
                console.log('[AuthContext] New token found in URL, updating session');
                setToken(urlToken);
                // The getCurrentUser call below will sync this to storage
            }
            
            // Clear the token from URL to keep it clean if present
            if (urlToken) {
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        }

        // Always try to refresh/sync user data from server
        console.log('[AuthContext] Fetching current user session...');
        try {
            const result = await getCurrentUser();
            
            if (result && result.user) {
                console.log('[AuthContext] Session found for:', result.user.email);
                const { user: freshUser, token: freshToken } = result;
                setUser(freshUser);
                if (freshToken) {
                    setToken(freshToken);
                    if (typeof window !== 'undefined') {
                        setAuth(freshToken, freshUser);
                    }
                }
            } else if (result === null) {
                // Only clear session if result is explicitly null (meaning unauthorized 401/403)
                // BUT: Check if we are in the middle of a payment flow or just returned from one
                const isPaymentFlow = typeof window !== 'undefined' && (
                    window.location.pathname.startsWith('/payment') || 
                    document.referrer.includes('/payment')
                );

                if (isPaymentFlow && (storedUser || storedToken)) {
                    console.log('[AuthContext] Session invalid (401) during payment flow. Preserving local session for now.');
                    // Don't log out yet, maybe the cookie just needs to be re-synced
                    if (storedToken && typeof window !== 'undefined') {
                        setAuth(storedToken, storedUser);
                    }
                    return;
                }

                console.log('[AuthContext] Session invalid (401), logging out');

                // Clear state
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
                setUser(null);
                setToken(null);

                // Only show login modal for ADMIN and SELLER accounts
                const accountType = storedUser?.accountType?.toUpperCase();
                if (accountType === 'ADMIN' || accountType === 'SELLER') {
                    showLogin(null, null, 'session_expired');
                }
            }
        } catch (error) {
            console.error('[AuthContext] Error refreshing user data:', error);
            // Don't log out on network/server errors - keep existing session
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        if (typeof window !== 'undefined') {
            setAuth(authToken, userData);
        }
        // Dispatch event for other components
        window.dispatchEvent(new Event('login-success'));
    };

    const logout = async () => {
        try {
            await logoutService(); // If you have a server-side logout or cookie clearing
            setUser(null);
            setToken(null);
            if (typeof window !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();
            }
            router.push('/');
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const value = {
        user,
        token,
        role: user?.accountType || null, // Assuming accountType is the role field
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
