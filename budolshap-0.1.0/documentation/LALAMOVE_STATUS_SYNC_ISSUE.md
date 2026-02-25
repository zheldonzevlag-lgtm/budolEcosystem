# Lalamove Order Status Synchronization Issue

## Current Problem
The order status is not synchronized correctly between:
1. **Lalamove Status** (from API/Webhook)
2. **Shipping Status** (order.shipping.status)
3. **Main Order Status** (order.status - what buyer/seller see)

## Lalamove Status Flow

### Lalamove Statuses:
- `ASSIGNING_DRIVER` → Looking for driver
- `ON_GOING` → Driver assigned, heading to pickup
- `PICKED_UP` → Driver picked up the package
- `COMPLETED` → Delivery completed
- `CANCELLED`/`REJECTED`/`EXPIRED` → Delivery failed

### Expected Mapping:

| Lalamove Status | Shipping Status | Main Order Status | Buyer Sees | Seller Sees |
|----------------|----------------|-------------------|------------|-------------|
| `ASSIGNING_DRIVER` | `ASSIGNING_DRIVER` | `PROCESSING` | "Processing" | "Needs Driver" |
| `ON_GOING` | `ON_GOING` | `PROCESSING` or `IN_TRANSIT`* | "Driver Assigned" | "Driver En Route" |
| `PICKED_UP` | `PICKED_UP` | `IN_TRANSIT` | "In Transit" | "Package Picked Up" |
| `COMPLETED` | `COMPLETED` | `DELIVERED` | "Delivered" | "Delivered" |
| `CANCELLED` | `CANCELLED` | `PROCESSING` | "Delivery Failed" | "Rebook Needed" |

*Should be IN_TRANSIT once driver picks up from seller

## Current Issues:

### Issue 1: DRIVER_ASSIGNED Event
**Webhook Handler (Line 210-216):**
```javascript
case 'DRIVER_ASSIGNED':
    updatedShipping.status = 'ON_GOING';
    // Does NOT update main order.status
```
**Problem:** Shipping status changes but main order status stays `PROCESSING`

### Issue 2: ON_GOING Status
**Sync Endpoint (Line 121-127):**
```javascript
if (lalamoveStatus === 'PICKED_UP') {
    // Only PICKED_UP triggers IN_TRANSIT
}
```
**Problem:** `ON_GOING` status is ignored, doesn't update order status

### Issue 3: Missing Status Transitions
Neither webhook nor sync handles:
- `ASSIGNING_DRIVER` → Should keep as `PROCESSING`
- `ON_GOING` → Should transition to `IN_TRANSIT` (or stay `PROCESSING` until PICKED_UP)

## Recommended Fix:

### Option A: Conservative (Safer)
- `ASSIGNING_DRIVER` → Order: `PROCESSING`
- `ON_GOING` (Driver Assigned) → Order: `PROCESSING` 
- `PICKED_UP` → Order: `IN_TRANSIT`
- `COMPLETED` → Order: `DELIVERED`

### Option B: Proactive (Better UX)
- `ASSIGNING_DRIVER` → Order: `PROCESSING`
- `ON_GOING` (Driver Assigned) → Order: `IN_TRANSIT`
- `PICKED_UP` → Order: `IN_TRANSIT` (no change)
- `COMPLETED` → Order: `DELIVERED`

## Which approach do you prefer?
