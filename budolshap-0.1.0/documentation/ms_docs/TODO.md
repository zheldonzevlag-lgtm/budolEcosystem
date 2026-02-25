# Project Roadmap & Todo List

This checklist tracks the implementation of the Multi-Vendor E-Commerce Platform features.

## Phase 1: Foundation (Critical Architecture)
- [/] **Database Schema Updates**
    - [ ] Create `Cart` and `CartItem` models in Prisma (replace JSON cart).
    - [ ] Create `Wallet`, `Transaction`, and `PayoutRequest` models.
    - [ ] Run `prisma migrate dev` to apply changes.
- [ ] **Backend Logic Refactoring**
    - [ ] Refactor `POST /api/orders` to support multi-store checkout in a single transaction.
    - [ ] Ensure `Cart` items are correctly removed after purchase (only purchased items).
    - [ ] Implement automatic commission deduction logic upon order payment.
- [ ] **Frontend Updates**
    - [ ] Update `OrderSummary.jsx` to handle multi-store checkout payload.
    - [ ] Update `Cart` page to fetch from new `Cart` model API.

## Phase 2: Seller Empowerment
- [ ] **Shipping Configuration**
    - [ ] Add `shippingProfile` field/model to `Store`.
    - [ ] Create "Shipping Settings" page in Seller Dashboard.
    - [ ] Implement logic to calculate shipping cost based on profile (Flat/Weight/Distance).
- [ ] **Coupon Management**
    - [ ] Update `Coupon` model to support `storeId` (nullable).
    - [ ] Create "Coupons" page in Seller Dashboard for store-specific coupons.
    - [ ] Update checkout logic to validate store-specific coupons.
- [ ] **Financials**
    - [ ] Create "Wallet" page in Seller Dashboard (view balance, history).
    - [ ] Implement "Request Payout" functionality.

## Phase 3: Customer Experience
- [ ] **Returns & Refunds**
    - [ ] Update `OrderStatus` enum with `RETURN_REQUESTED`, `RETURN_APPROVED`, `REFUNDED`.
    - [ ] Create UI for Buyers to request returns (with image upload).
    - [ ] Create UI for Sellers to approve/reject returns.
    - [ ] Implement refund logic (deduct from Seller Wallet).
- [ ] **Communication**
    - [ ] Create `Chat` and `Message` models.
    - [ ] Implement "Chat with Seller" button on Product/Order pages.
    - [ ] Build real-time chat interface (using Socket.io or polling).
- [ ] **Notifications**
    - [ ] Set up email templates for Order Placed, Shipped, Delivered, Return Requested.
    - [ ] Integrate email service (Nodemailer) into API routes.

## Phase 4: Admin & Polish
- [ ] **Admin Dashboard**
    - [ ] Create "Payouts" page to view and process withdrawal requests.
    - [ ] Create "Store Verification" page for KYC documents.
    - [ ] Add platform-wide analytics (Total GMV, Commission Revenue).
- [ ] **Security & Testing**
    - [ ] Audit all API routes for proper authentication/authorization checks.
    - [ ] Perform end-to-end testing of the full multi-vendor flow.
