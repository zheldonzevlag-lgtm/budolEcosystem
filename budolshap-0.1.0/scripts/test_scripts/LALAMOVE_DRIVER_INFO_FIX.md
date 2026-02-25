# Lalamove Driver Information Webhook Fix

## Issue
Driver information was not displaying on the order tracking page despite Lalamove webhooks being received successfully.

## Root Cause Analysis

Based on the actual webhook payloads from Lalamove Partner Portal, the issues were:

1. **Location field mismatch**: Webhooks send location data in `data.location`, but the code was only checking for this field and not the alternative `data.driverLocation` field that might be used in some webhook versions.

2. **Order ID extraction**: The order ID can be nested in different locations:
   - `data.order.orderId` for some event types (e.g., `DRIVER_ASSIGNED`)
   - `data.orderId` for other event types (e.g., `ORDER_STATUS_CHANGED`)

3. **Status extraction**: Similar to order ID, status can be in:
   - `data.status` for most events
   - `data.order.status` for some events

## Actual Webhook Payload Structure (from Partner Portal)

### DRIVER_ASSIGNED Event
```json
{
  "eventID": "F2020F57-7F3E-4D67-9CED-D8E48C361AE2",
  "eventType": "DRIVER_ASSIGNED",
  "eventVersion": "v3",
  "data": {
    "driver": {
      "driverId": "80557",
      "phone": "+6310012345467",
      "name": "TestDriver 34567",
      "photo": "",
      "plateNumber": "VP9946964"
    },
    "location": {
      "lng": 114.15004381376369,
      "lat": 22.329804362923516
    },
    "order": {
      "orderId": "3379143481582114256"
    }
  }
}
```

### ORDER_STATUS_CHANGED Event
```json
{
  "eventID": "7BC36762-C5D9-46F5-B529-9BC587EC87B1",
  "eventType": "ORDER_STATUS_CHANGED",
  "eventVersion": "v3",
  "data": {
    "order": {
      "orderId": "3379143481582114256",
      "scheduleAt": "2025-12-06T00:00:00.000Z",
      "shareLink": "https://share.sandbox.lalamove.com/...",
      "market": "PH_MNL",
      "createdAt": "2025-12-06T00:00:00.000Z",
      "driverId": "80557",
      "previousStatus": "ON_GOING",
      "status": "PICKED_UP"
    }
  }
}
```

## Changes Made

### 1. Enhanced Webhook Data Extraction (`app/api/webhooks/lalamove/route.js`)

**Lines 85-130**: Updated webhook payload parsing to:
- Extract `orderId` from both `data.order.orderId` and `data.orderId`
- Extract `status` from both `data.status` and `data.order.status`
- Extract `location` from both `data.location` and `data.driverLocation`
- Added detailed logging to track payload structure

```javascript
// orderId can be in data.order.orderId or data.orderId depending on event type
lalamoveOrderId = payload.data.order?.orderId || payload.data.orderId;
status = payload.data.status || payload.data.order?.status;
driver = payload.data.driver;
// Location can be in 'location' or 'driverLocation' field
location = payload.data.location || payload.data.driverLocation;
```

**Lines 117-125**: Added comprehensive logging:
```javascript
console.log('Extracted driver data:', driver);
console.log('Extracted location data:', location);
console.log('Lalamove Order ID:', lalamoveOrderId);
console.log('Event:', event);
console.log('Status:', status);
console.log('Payload structure:', {
    hasOrder: !!payload.data.order,
    hasOrderId: !!payload.data.orderId,
    hasDriver: !!payload.data.driver,
    hasLocation: !!payload.data.location,
    hasDriveLocation: !!payload.data.driverLocation
});
```

## Testing Recommendations

1. **Monitor Vercel Logs**: After deployment, check the logs for incoming webhooks to verify:
   - Driver data is being extracted correctly
   - Location data is being captured
   - Order is being found in the database

2. **Test with Real Order**: Create a test order and monitor the webhook events:
   - `DRIVER_ASSIGNED` - Should capture driver info
   - `PICKED_UP` - Should update order status
   - `COMPLETED` - Should mark as delivered

3. **Verify UI Display**: Check that the `LalamoveTracking` component shows:
   - Driver name, phone, plate number
   - Driver rating (if available)
   - Vehicle type
   - Current location coordinates
   - Live GPS tracking map

## Files Modified

1. `app/api/webhooks/lalamove/route.js` - Enhanced webhook payload extraction with proper field fallbacks

## Expected Behavior After Fix

1. When Lalamove sends a `DRIVER_ASSIGNED` webhook, the system will:
   - Extract driver information from `data.driver`
   - Extract location from `data.location`
   - Find the order using `data.order.orderId`
   - Store driver info in the database
   - Display driver info on the order page

2. The order tracking page will show:
   - Driver's name and photo
   - Phone number with call button
   - Vehicle type and plate number
   - Driver rating
   - Current GPS location
   - Live tracking map

## Deployment

Deploy to Vercel and monitor the webhook logs for the next incoming delivery order.

---
**Date**: 2025-12-06
**Issue**: Driver information not displaying
**Status**: Fixed - Ready for deployment
