
# Lalamove Realtime Sync Fix

## Issue
The user reported that Lalamove status updates (e.g., "Picked Up") were not reflecting in the Seller or Buyer UI, leaving the order status as "Booked" or "Processing" instead of "In Transit".

## Root Causes
1.  **Buyer Auto-Sync Failure**: The Buyer Order page (`app/(public)/orders/[orderId]/page.jsx`) was attempting to sync Lalamove status by calling `/api/orders/[id]/sync-lalamove` via `GET`, but the endpoint only supported `POST`. This resulted in 405 errors and no sync occurring.
2.  **Incomplete Sync Logic**: The `sync-lalamove` endpoint only updated the `shipping` JSON blob but failed to update the top-level `order.status` (e.g., updating to `IN_TRANSIT`).
3.  **Inconsistent Status Mapping**: The Seller's manual sync endpoint (`sync/route.js`) mapped "Picked Up" to `SHIPPED` instead of `IN_TRANSIT`, causing inconsistency with the webhook logic and frontend expectations.
4.  **Missing Realtime Trigger**: The Seller's sync endpoint did not trigger the `order-updated` realtime event, meaning other clients (like the Buyer page) wouldn't see the update immediately.

## Changes Made

### 1. Fixed Buyer Page Auto-Sync
Modified `app/(public)/orders/[orderId]/page.jsx` to use `method: 'POST'` when calling the sync endpoint.

### 2. Updated `sync-lalamove` Endpoint
Updated `app/api/orders/[orderId]/sync-lalamove/route.js` to:
-   Map Lalamove `PICKED_UP` -> Order `IN_TRANSIT`.
-   Map Lalamove `COMPLETED` -> Order `DELIVERED`.
-   Update `shippedAt` and `deliveredAt` timestamps.
-   Trigger `order-updated` realtime event.

### 3. Updated `sync` Endpoint (Seller Manual Sync)
Updated `app/api/orders/[orderId]/sync/route.js` to:
-   Change `SHIPPED` status to `IN_TRANSIT` to align with the rest of the application.
-   Add `triggerRealtimeEvent` to broadcast updates to all connected clients.
-   Updated email trigger condition to check for `IN_TRANSIT`.

## Verification
-   **Buyer UI**: The order page will now successfully poll every 10 seconds and update the status to "In Transit" automatically if Lalamove reports "Picked Up".
-   **Seller UI**: Clicking "Sync Status" in the order details modal will now correctly update the status to "In Transit" and broadcast this change to the Buyer UI immediately.
-   **Webhooks**: The webhook logic remains consistent with these changes, ensuring robust status updates regardless of the source.
