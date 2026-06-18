# BudolPay Mobile Verification & Integration Checklist

This document tracks the steps required to ensure `budolPayMobile` is fully integrated and connected to all ecosystem services.

## 1. Environment & Configuration Check
- [x] Verify `budolPayMobile` API settings (defaults to `budolpay.vercel.app` via `API_HOST`).
- [ ] Verify `budolpay` (Vercel `budolpay-admin`) production URL is correctly aligned and accessible.
- [ ] Identify corrupted Vercel environment variables in `budolpay-admin` (`NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY`, `NEXT_PUBLIC_PUSHER_KEY`, `PUSHER_APP_ID`).
- [ ] Clean and redeploy `budolpay-admin` to ensure the API backend is healthy.

## 2. Authentication Flow (BudolID)
- [ ] Verify that `budolPayMobile` successfully connects to the auth service.
- [ ] Confirm `JWT_SECRET` in `budolpay-admin` matches `budolID` and `budolShap`.
- [ ] Test the mobile token parsing and storage logic.

## 3. Core Services Integration
- [ ] **Database**: Verify `DATABASE_URL` in `budolpay-admin` connects to `budolpay` schema in Neon.
- [ ] **Sockets**: Verify `NEXT_PUBLIC_SOCKET_URL` (`budol-websocket-server.onrender.com`).
- [ ] **Payment**: Ensure `PAYMONGO_SECRET_KEY` and `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` are correct.
- [ ] **Notifications**: Ensure `SMTP` / SMS configurations in the `budolpay-admin` backend are valid.

## 4. Mobile App Build & Testing
- [ ] Verify `flutter build apk` succeeds without issues.
- [ ] Ensure geocoding and mapping configurations are correct.
- [ ] Confirm API logs inside the app (via `ApiService`) do not return 401 or 503 errors.
