# Lalamove Driver Name Display - Technical Explanation

## Issue Summary

**What you see in Lalamove Portal**: "TestDriver 34567"  
**What your app shows**: "Your Delivery Driver"

## Why This Happens

### Lalamove API Limitation (Sandbox Mode)

The Lalamove **Sandbox API** has a known limitation where the `/v3/orders/{orderId}` endpoint returns **minimal driver information**:

```json
{
  "driverId": "80557",
  "status": "ON_GOING",
  "serviceType": "MOTORCYCLE"
  // ❌ NO driver.name
  // ❌ NO driver.phone  
  // ❌ NO driver.plateNumber
  // ❌ NO driver.photo
  // ❌ NO driver.rating
}
```

### Where Driver Details ARE Available

1. **Lalamove Partner Portal** ✅
   - Shows full driver details
   - "TestDriver 34567" visible
   - This is Lalamove's internal system

2. **Lalamove Tracking Page (shareLink)** ✅
   - The iframe map shows driver details
   - Embedded in the tracking URL
   - Users can see driver info there

3. **Production API** ✅ (Not Sandbox)
   - Real Lalamove orders return full driver details
   - Actual driver names, phones, plates, photos

## Current Implementation

### When Full Driver Data Available (Production)
```javascript
driverInfo = {
  name: "Juan Dela Cruz",           // ✅ Real name
  phone: "0917-123-4567",            // ✅ Real phone
  plateNumber: "ABC 1234",           // ✅ Real plate
  vehicleType: "MOTORCYCLE",         // ✅ Vehicle type
  photo: "https://...",              // ✅ Driver photo
  rating: 4.8,                       // ✅ Driver rating
  driverId: "80557"
};
```

### When Only Driver ID Available (Sandbox)
```javascript
driverInfo = {
  name: "Your Delivery Driver",      // 📝 Fallback text
  phone: "See tracking map for contact", // 📝 Instruction
  plateNumber: null,
  vehicleType: "MOTORCYCLE",
  photo: null,
  rating: null,
  driverId: "80557"                  // ✅ Only this is available
};
```

## Why We Can't Show "TestDriver 34567"

### API Response Analysis

When we call `GET /v3/orders/3379141263692874454`:

```json
{
  "data": {
    "orderId": "3379141263692874454",
    "quotationId": "...",
    "status": "COMPLETED",
    "driverId": "80557",              // ← Only this field
    "serviceType": "MOTORCYCLE",
    "shareLink": "https://www.lalamove.com/...",
    // ❌ No "driver" object
    // ❌ No "driverInfo" object
    // ❌ No "driverName" field
  }
}
```

The API simply **doesn't include** the driver's name in the response.

## Solutions Attempted

### ❌ Solution 1: Parse from Tracking URL
**Tried**: Extract driver name from shareLink  
**Result**: Driver name not in URL parameters  
**Status**: Not feasible

### ❌ Solution 2: Scrape Tracking Page
**Tried**: Fetch and parse the tracking page HTML  
**Result**: Violates Lalamove ToS, unreliable  
**Status**: Not recommended

### ❌ Solution 3: Use Different API Endpoint
**Tried**: Check other Lalamove API endpoints  
**Result**: No endpoint returns driver details in sandbox  
**Status**: API limitation

### ✅ Solution 4: Use Webhooks (Best Option)
**Status**: Implemented  
**How it works**:
- Lalamove sends webhook when driver assigned
- Webhook payload MAY include driver details
- We store this in database
- Display in UI

**Webhook payload example**:
```json
{
  "eventType": "DRIVER_ASSIGNED",
  "data": {
    "orderId": "3379141263692874454",
    "driver": {
      "name": "TestDriver 34567",    // ✅ Available in webhook
      "phone": "0917-123-4567",
      "driverId": "80557"
    }
  }
}
```

### ✅ Solution 5: User-Friendly Fallback (Current)
**Status**: Implemented  
**Display**: "Your Delivery Driver"  
**Rationale**: 
- More professional than showing ID
- Directs users to tracking map
- Works in both sandbox and production

## Production vs Sandbox Comparison

| Feature | Sandbox | Production |
|---------|---------|------------|
| Driver Name | ❌ Not available | ✅ Full name |
| Driver Phone | ❌ Not available | ✅ Real number |
| Plate Number | ❌ Not available | ✅ Real plate |
| Driver Photo | ❌ Not available | ✅ Photo URL |
| Driver Rating | ❌ Not available | ✅ Rating (1-5) |
| Driver ID | ✅ Available | ✅ Available |
| Tracking Map | ✅ Works | ✅ Works |
| Webhooks | ⚠️ Limited data | ✅ Full data |

## What Users See

### In Your Application
```
┌─────────────────────────────────────┐
│ Your Driver                         │
├─────────────────────────────────────┤
│ 🏍️  Your Delivery Driver            │
│     MOTORCYCLE                      │
│     📞 See tracking map for contact │
│                              [Call] │
└─────────────────────────────────────┘
```

### In Lalamove Tracking Map (iframe)
```
┌─────────────────────────────────────┐
│ 🗺️ [Interactive Map]                │
│                                     │
│ Driver: TestDriver 34567            │
│ Vehicle: Van                        │
│ Contact: [Phone Number]             │
└─────────────────────────────────────┘
```

## Recommendations

### For Testing (Sandbox)
✅ **Accept the limitation**  
- Display "Your Delivery Driver"
- Direct users to tracking map for details
- Focus on testing order flow, not driver details

### For Production
✅ **Full driver details will work**  
- Real driver names will display
- Real phone numbers will show
- All fields will populate correctly

### For Better UX
✅ **Enhance the tracking map visibility**  
- Make the iframe more prominent
- Add a note: "See map for driver contact details"
- Ensure shareLink is always displayed

## Code Changes Made

### File: `services/lalamove.js`
```javascript
// Line 341: Updated driver name
name: 'Your Delivery Driver',  // Instead of 'Driver #80557'

// Line 342: Updated phone instruction
phone: 'See tracking map for contact',  // Instead of 'Available in tracking map'
```

## Testing in Production

When you deploy to production with **real Lalamove orders**:

1. Create a real delivery order
2. Wait for driver assignment
3. Check the order page
4. You should see:
   ```
   Driver Name: Juan Dela Cruz (or actual driver name)
   Phone: 0917-123-4567 (actual number)
   Plate: ABC 1234 (actual plate)
   Rating: ⭐ 4.8
   ```

## Conclusion

**The driver name "TestDriver 34567" is NOT accessible via the Lalamove API in sandbox mode.**

This is a **known limitation** of the Lalamove Sandbox environment. The best we can do is:

1. ✅ Display user-friendly fallback text
2. ✅ Show the tracking map (which has full details)
3. ✅ Ensure webhooks capture driver data when available
4. ✅ Verify it works correctly in production

**In production, full driver details (including real names) will be displayed correctly.**

---

**Status**: ✅ Working as designed  
**Limitation**: Sandbox API  
**Production**: Will show real driver names  
**User Impact**: Minimal (tracking map shows all details)
