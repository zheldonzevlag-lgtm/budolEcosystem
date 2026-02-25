# Multi-Vendor E-Commerce Platform Recommendations

This document outlines the step-by-step process to transform the current `budolshap` application into a robust, full-featured multi-vendor e-commerce platform.

## 1. Critical Architecture Fixes

### 1.1. Fix Cart & Checkout Logic (High Priority)
**Current Issue:** The current implementation stores the cart as a JSON object on the `User` model. When an order is placed for a specific store, the backend clears the *entire* cart, potentially deleting items intended for other stores.
**Recommendation:**
- **Database Change:** Create a dedicated `Cart` and `CartItem` model in Prisma.
  ```prisma
  model Cart {
    id        String     @id @default(cuid())
    userId    String     @unique
    items     CartItem[]
    updatedAt DateTime   @updatedAt
  }

  model CartItem {
    id        String  @id @default(cuid())
    cartId    String
    productId String
    quantity  Int
    cart      Cart    @relation(fields: [cartId], references: [id])
    product   Product @relation(fields: [productId], references: [id])
  }
  ```
- **Backend Logic:** Update the order creation endpoint to accept a "Checkout" request that might contain items from multiple stores. The backend should:
  1. Receive the list of items to checkout.
  2. Group them by `storeId` internally.
  3. Create multiple `Order` records (one per store) within a single database transaction (`prisma.$transaction`).
  4. Remove *only* the purchased items from the database-backed Cart.

### 1.2. Implement Wallet & Payout System
**Current Issue:** There is no mechanism to track seller earnings, platform commissions, or handle payouts.
**Recommendation:**
- **Database Change:** Add `Wallet`, `Transaction`, and `PayoutRequest` models.
  ```prisma
  model Wallet {
    id        String   @id @default(cuid())
    storeId   String   @unique
    balance   Float    @default(0)
    pending   Float    @default(0)
    store     Store    @relation(fields: [storeId], references: [id])
  }

  model Transaction {
    id          String   @id @default(cuid())
    walletId    String
    amount      Float
    type        String   // CREDIT (Sale), DEBIT (Payout), FEE (Commission)
    description String
    createdAt   DateTime @default(now())
    wallet      Wallet   @relation(fields: [walletId], references: [id])
  }
  ```
- **Logic:**
  - When an order is paid, credit the `Wallet.pending` balance.
  - Move funds from `pending` to `balance` after the order is `DELIVERED` + X days (return window).
  - Deduct a platform commission percentage automatically.

## 2. Feature Enhancements

### 2.1. Advanced Shipping Configuration
**Current Issue:** Shipping is hardcoded to "Free".
**Recommendation:**
- Allow sellers to define shipping profiles in their dashboard:
  - **Flat Rate:** Per order or per item.
  - **Weight Based:** Calculate based on total weight.
  - **Distance/Zone Based:** Different rates for different regions.
- Update `Order` model to store `shippingCost` separately from `total`.

### 2.2. Returns & Refunds Management
**Current Issue:** No support for returns.
**Recommendation:**
- Add new `OrderStatus` values: `RETURN_REQUESTED`, `RETURN_APPROVED`, `REFUNDED`.
- Create a UI for buyers to request a return with a reason and photo proof.
- Create a UI for sellers to approve/reject returns.
- Integrate refund logic with the Wallet system (deduct from seller balance).

### 2.3. Vendor Specific Coupons
**Current Issue:** Coupons seem to be global or applied to the total.
**Recommendation:**
- Add `storeId` to the `Coupon` model (nullable).
- If `storeId` is present, the coupon only applies to items from that store.
- If `storeId` is null, it's a platform-wide coupon (cost borne by platform admin).

### 2.4. Messaging System
**Current Issue:** No communication channel between buyer and seller.
**Recommendation:**
- Implement a chat system using a library like `socket.io` or a service like Pusher.
- Add a `Chat` model linking `User` (buyer) and `Store` (seller).
- Allow buyers to ask questions about products or orders.

## 3. Admin & Seller Dashboard Improvements

### 3.1. Seller Verification (KYC)
- Add a "Verify Store" flow where sellers upload ID/Business documents.
- Admin dashboard to review and approve these documents before the store goes "Live".

### 3.2. Payout Requests
- Create a "Withdraw" button in the seller dashboard.
- Admin dashboard to view and process payout requests (mark as paid after transferring funds manually or via Stripe Connect).

### 3.3. Detailed Analytics
- **Seller:** Sales over time graph, top selling products, traffic sources.
- **Admin:** Total platform GMV (Gross Merchandise Value), total commission earned, active vs inactive stores.

## 4. Step-by-Step Implementation Plan

1.  **Phase 1: Foundation (Weeks 1-2)**
    - Refactor Database (Cart, Wallet models).
    - Fix Order Creation API (Atomic transactions, multi-order handling).
    - Implement Commission logic.

2.  **Phase 2: Seller Empowerment (Weeks 3-4)**
    - Build Shipping Configuration UI.
    - Build Coupon Management for Sellers.
    - Implement Payout Request flow.

3.  **Phase 3: Customer Experience (Weeks 5-6)**
    - Build Return/Refund UI.
    - Implement Messaging System.
    - Add Email Notifications for all major status changes.

4.  **Phase 4: Admin & Polish (Weeks 7-8)**
    - Admin Payout Management.
    - KYC/Verification Workflow.
    - Final Testing & Security Audit.
