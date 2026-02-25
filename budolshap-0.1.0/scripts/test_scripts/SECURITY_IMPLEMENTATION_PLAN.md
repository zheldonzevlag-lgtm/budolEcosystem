# Security Enhancement Implementation Plan
**Date:** 2025-12-11
**Target:** Budolshap V3

This document outlines the phased implementation plan for securing the Budolshap application, focusing on Automatic Idle Logout, Cookie Security, and Rate Limiting.

## Phase 1: Cookie Security Enhancements (Refinement)
**Objective:** Ensure all authentication cookies are tamper-proof and only transmitted over secure connections.
**Status:** Partially Implemented (Basic `secure` flag added to login).
**Timeframe:** 1-2 Hours

### Detailed Steps:
1.  **Audit Auth Endpoints:**
    *   Review `app/api/auth/login/route.js`.
    *   Review `app/api/auth/register/route.js` (if it sets cookies).
    *   Review `app/api/auth/logout/route.js` (ensure proper clearance).
2.  **Standardize Cookie Config:**
    *   Create a shared constant or helper function for cookie options to ensure consistency.
    *   **Settings:**
        *   `httpOnly: true` (Prevent XSS access)
        *   `secure: process.env.NODE_ENV === 'production'` (HTTPS only in prod)
        *   `sameSite: 'lax'` (Prevent CSRF while allowing navigation)
        *   `path: '/'`
3.  **Environment Variable Check:**
    *   Verify `NODE_ENV` is correctly set in the Vercel production environment.

## Phase 2: Automatic Idle Logout
**Objective:** Prevent unauthorized access to sensitive sessions (Admin/Seller) if a device is left unattended.
**Target Areas:** `/admin/*`, `/store/*`
**Timeframe:** 3-4 Hours

### Detailed Steps:
1.  **Create `useIdleTimeout` Hook:**
    *   **Logic:** Listen for window events (`mousemove`, `keydown`, `click`, `scroll`).
    *   **Timer:** distinct timers for "Warning" (e.g., 14 mins) and "Logout" (e.g., 15 mins).
2.  **Create `SessionTimeoutModal` Component:**
    *   **UI:** A modal that appears when the "Warning" timer triggers.
    *   **Action:** "Stay Logged In" button to reset the timer.
3.  **Integration:**
    *   Wrap `app/admin/layout.jsx` and `app/store/layout.jsx` with this logic.
    *   Ensure it does *not* affect regular shoppers (Buyer Layout).
4.  **Logout Logic:**
    *   On timeout, call the `api/auth/logout` endpoint.
    *   Clear local state/storage.
    *   Redirect to the specific login page (`/admin/login` or `/store/login`).

## Phase 3: API Rate Limiting
**Objective:** Protect authentication endpoints from brute-force attacks and abuse.
**Target Areas:** `/api/auth/login`, `/api/auth/register`
**Timeframe:** 4-5 Hours

### Detailed Steps:
1.  **Choose Strategy:**
    *   **Option A (Vercel KV / Upstash):** Best for distributed serverless systems.
    *   **Option B (In-Memory Map):** Simple, free, but doesn't share state across Vercel serverless function instances (each lambda has its own memory). *Note: Since Vercel functions are ephemeral, strict IP rate limiting usually requires a persistent store (Redis/DB) or using Edge Middleware.*
    *   **Selected Strategy:** **Edge Middleware Rate Limiting** (using Vercel's built-in capabilities or a simple logic if no KV is available, though KV is recommended). Alternatively, implement a DB-based limit for critical actions if KV is overkill.
    *   *Simple Implementation:* Token Bucket algorithm using a database table `RateLimit` (IP, endpoint, count, expiresAt) or an in-memory solution appropriate for the current scale.
2.  **Implementation:**
    *   Create `lib/rate-limit.js`.
    *   Define limits: e.g., 5 failed attempts per 15 minutes per IP.
3.  **Apply Exception Handling:**
    *   If limit exceeded, return `429 Too Many Requests`.
    *   Include `Retry-After` header.
4.  **Middleware Integration:**
    *   Apply logic in `middleware.js` or directly inside `app/api/auth/login/route.js`.

## Summary of Estimated Time
| Phase | Feature | Estimated Time | Complexity | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Cookie Security | 1-2 Hours | Low | ✅ Completed |
| **2** | Idle Logout | 3-4 Hours | Medium | ✅ Completed (Dynamic) |
| **3** | Rate Limiting | 4-5 Hours | Medium/High | ✅ Completed (DB-Backed + UI) |
| **Total** | | **~8-11 Hours** | | |

## Project Completion (2025-12-12)
All security phases have been successfully implemented and deployed to production.
- **Production URL:** https://budolshap-v3.vercel.app
- **Admin Configuration:** Secure settings are fully configurable via the new modular Admin Settings.
  - See [Admin Settings Refactor Documentation](ADMIN_SETTINGS_REFACTOR_2025_12_12.html) for structure details.
- **Documentation:** Full HTML documentation generated for all phases.
