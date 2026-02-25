# SSO and Session Persistence Fixes (v1.0.1)

## Overview
This update resolves critical issues with the SSO (Single Sign-On) integration between **budolID** and **budolShap**, specifically addressing redirect failures, session loss after clearing site data, and re-login prompts during menu navigation.

## Issues Fixed

### 1. SSO Login Persistence Failure
**Problem**: After a successful login on budolID, users were redirected back to budolShap but were not signed in. This was caused by a mismatch in cookie naming (`budolshap_token` vs `token`) and inconsistent JWT payload expectations.

**Solution**:
- Standardized the use of both `budolshap_token` and `token` cookies for compatibility.
- Updated the `/api/auth/me` endpoint to support multiple user ID claims (`userId`, `id`, `sub`) in the JWT payload.
- Synchronized `JWT_SECRET` across the ecosystem.

**Files Modified**:
- `lib/auth.js`
- `app/api/auth/me/route.js`
- `app/api/auth/sso/callback/route.js`

### 2. Session Loss After Clearing Site Data
**Problem**: Clearing `localStorage` caused users to be logged out even if valid authentication cookies were still present.

**Solution**:
- Enhanced `AuthContext.jsx` to synchronize the session from cookies to `localStorage` on initial load.
- Updated `auth-client.js` to fallback to cookies if `localStorage` is empty.

**Files Modified**:
- `context/AuthContext.jsx`
- `lib/auth-client.js`

### 3. Re-login Prompts During Navigation
**Problem**: Navigation to protected routes (e.g., `/store/*`) occasionally triggered re-login prompts due to race conditions between `AuthContext` loading and component mounting.

**Solution**:
- Improved `StoreLayout.jsx` to wait for `authLoading` to be false before validating the seller session.
- Added comprehensive logging to track session state transitions.

**Files Modified**:
- `components/store/StoreLayout.jsx`

## Technical Details

### Dual-Token Cookie Strategy
Both `budolshap_token` and `token` are now set during login/SSO callback to ensure that both the Edge Middleware (`proxy.js`) and standard API routes can verify the session.

```javascript
// Example from sso/callback/route.js
response.cookies.set('budolshap_token', localToken, {
    httpOnly: false, // Allow client-side sync
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
});
response.cookies.set('token', localToken, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
});
```

### Edge Middleware Verification
The `proxy.js` middleware now correctly validates tokens using the `jose` library, which is compatible with the Next.js Edge Runtime.

## Implementation Checklist
- [x] Synchronize JWT_SECRET in `.env` files.
- [x] Update `verifyTokenEdge` in `lib/token-edge.js`.
- [x] Update `getAuthFromRequest` in `lib/auth.js`.
- [x] Update `AuthContext.jsx` load logic.
- [x] Verify SSO redirect URI in `budolID` configuration.

## Verification
- Verified with user: `tony.stark@budolshap.com`
- Password: `budolshap`
- Test Flow: SSO Login -> Redirect to BudolShap -> Navigate to Store Dashboard -> Verify no re-login prompt.
