// Client-side authentication utilities

export function getToken() {
    if (typeof window === 'undefined') return null;

    // Try cookies first as they are set by the server during SSO callback
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => {
        const trimmed = c.trim();
        return trimmed.startsWith('budolshap_token=') || trimmed.startsWith('token=');
    });

    if (authCookie) {
        const parts = authCookie.split('=');
        if (parts.length >= 2) {
            const token = parts.slice(1).join('=');
            if (token && token !== 'undefined' && token !== 'null') {
                return token;
            }
        }
    }

    // Fallback to localStorage
    const localToken = localStorage.getItem('token');
    return (localToken && localToken !== 'undefined' && localToken !== 'null') ? localToken : null;
}

export function getUser() {
    if (typeof window === 'undefined') return null;

    // 1. Try localStorage
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('[auth-client] Failed to parse user from localStorage', e);
        }
    }

    // 2. Try to find user in cookies (if we stored it there as a fallback)
    const cookies = document.cookie.split(';');
    const userCookie = cookies.find(c => c.trim().startsWith('budolshap_user=') || c.trim().startsWith('user='));
    if (userCookie) {
        try {
            const parts = userCookie.split('=');
            if (parts.length >= 2) {
                const decodedUser = decodeURIComponent(parts.slice(1).join('='));
                const parsedUser = JSON.parse(decodedUser);
                if (parsedUser) {
                    // Sync back to localStorage
                    localStorage.setItem('user', JSON.stringify(parsedUser));
                    return parsedUser;
                }
            }
        } catch (e) {
            // Cookie might not be JSON or might be malformed
            console.warn('[auth-client] Could not parse user from cookie');
        }
    }

    return null;
}

export function setAuth(token, user) {
    if (typeof window === 'undefined') return;

    // Set in localStorage with error handling for QuotaExceededError
    try {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
        console.warn('[auth-client] localStorage quota exceeded, clearing image from local storage');
        // If it fails, try to save without the images which are likely the cause
        try {
            const scrubbedUser = { ...user };
            if (scrubbedUser.image?.startsWith('data:image')) scrubbedUser.image = '';
            if (scrubbedUser.store?.logo?.startsWith('data:image')) {
                scrubbedUser.store = { ...scrubbedUser.store, logo: '' };
            }
            localStorage.setItem('user', JSON.stringify(scrubbedUser));
        } catch (innerError) {
            console.error('[auth-client] Failed even with scrubbed user', innerError);
        }
    }

    // Also set in cookies as fallback (redundant but helps with persistence)
    // IMPORTANT: Cookies have a 4KB total limit. Base64 images will break this.
    // We must scrub the user object for cookie storage.
    const cookieUser = { ...user };
    if (cookieUser.image?.startsWith('data:image')) cookieUser.image = '';
    if (cookieUser.store?.logo?.startsWith('data:image')) {
        cookieUser.store = { ...cookieUser.store, logo: '' };
    }

    const cookieOptions = "; path=/; max-age=604800; SameSite=Lax";
    document.cookie = `budolshap_token=${token}${cookieOptions}`;

    try {
        const userJson = JSON.stringify(cookieUser);
        // If still too large for a cookie (approx 4KB), this might still fail or be truncated by browser
        if (userJson.length < 3000) {
            document.cookie = `budolshap_user=${encodeURIComponent(userJson)}${cookieOptions}`;
        }
    } catch (e) {
        console.warn('[auth-client] Failed to set user cookie', e);
    }
}

export function clearAuth() {
    if (typeof window === 'undefined') return;

    // WHY: Clear all storage to ensure no user data remains after logout.
    // This prevents other components (e.g., AddressModal) from reading
    // stale PII from localStorage via getUser().
    localStorage.clear();
    sessionStorage.clear();

    // Explicitly remove auth items (redundant but safe against partial clear)
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // WHY: Expire auth cookies explicitly. Without this, getUser() can recover
    // the old user from the `budolshap_user` cookie even after localStorage is
    // cleared, causing PII (name, phone, email, address) to leak into the
    // AddressModal form for guests on subsequent page interactions.
    // Setting max-age=0 immediately expires the cookies.
    const expireCookie = '; path=/; max-age=0; SameSite=Lax';
    document.cookie = `budolshap_token=${expireCookie}`;
    document.cookie = `budolshap_user=${expireCookie}`;
    document.cookie = `token=${expireCookie}`;
    document.cookie = `user=${expireCookie}`;
}

export async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        clearAuth();
    }
}

export async function getCurrentUser() {
    try {
        const token = getToken();
        console.log(`[auth-client] getCurrentUser called, local token present: ${!!token}`);
        // Even if no token in localStorage, still try the request. 
        // The server will check the budolshap_token cookie.
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/auth/me', {
            headers,
            credentials: 'include' // Explicitly include cookies
        });
        console.log(`[auth-client] /api/auth/me response status: ${response.status}`);
        if (response.ok) {
            const data = await response.json();
            // Sync to localStorage for other components to use
            if (data.user) {
                setAuth(data.token || token, data.user);
            }
            // Return both user and token (token might be from cookie)
            return { user: data.user, token: data.token || token };
        }

        // If 401/403, it's an explicit "unauthorized" - return null to trigger logout
        if (response.status === 401 || response.status === 403) {
            return null;
        }

        // For other errors (500, 404, etc), return undefined to keep current session
        return undefined;
    } catch (error) {
        console.error('Get current user error:', error);
        // Throw or return undefined to signal a network/unexpected error, not an auth failure
        return undefined;
    }
}
