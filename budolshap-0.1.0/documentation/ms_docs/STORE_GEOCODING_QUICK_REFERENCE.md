# Store Geocoding - Quick Reference Guide

## 🎯 Overview
This system geocodes store addresses to provide accurate pickup locations for Lalamove deliveries.

## 🚀 Quick Start

### 1. Deploy to Vercel
```bash
vercel deploy --prod
```

### 2. Run Database Migration (Production)
```bash
# Using Vercel CLI with env vars (if linked)
vercel env pull .env.production
npx prisma migrate deploy

# OR manually with connection string
DATABASE_URL="postgres://..." npx prisma migrate deploy
```

### 3. Geocode Existing Stores
```bash
# Run script against production DB
DATABASE_URL="postgres://..." node scripts/geocode-stores.js
```

## 📍 How It Works

### Automatic Geocoding Flow
1. **User selects Lalamove delivery** → LalamoveWidget activates
2. **System checks store coordinates** → If cached, use immediately
3. **If not cached** → Call `/api/stores/[storeId]/geocode`
4. **Geocode & cache** → Store coordinates in database
5. **Generate quote** → Use actual store location

### Manual Geocoding
```javascript
// Geocode a specific store
const response = await fetch(`/api/stores/${storeId}/geocode`, {
    method: 'PATCH'
});

const data = await response.json();
// Returns: { success: true, coordinates: { lat, lng }, address }
```

## 🔍 API Endpoints

### PATCH `/api/stores/[storeId]/geocode`
Geocode store address and cache coordinates.

**Response:**
```json
{
    "success": true,
    "cached": false,
    "coordinates": {
        "lat": 14.5547,
        "lng": 121.0244
    },
    "address": "123 Main St, Makati, Metro Manila"
}
```

## 📊 Database Schema

### Store Model
```prisma
model Store {
    // ... existing fields ...
    latitude    Float?  // Cached latitude
    longitude   Float?  // Cached longitude
}
```

## 🧪 Testing

### Check if Store Has Coordinates
```sql
SELECT id, name, address, latitude, longitude 
FROM "Store" 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

### Find Stores Without Coordinates
```sql
SELECT id, name, address 
FROM "Store" 
WHERE latitude IS NULL OR longitude IS NULL;
```

### Test Geocoding Endpoint
```bash
curl -X PATCH http://localhost:3000/api/stores/[storeId]/geocode
```

## 🔧 Troubleshooting

### Store Not Geocoding
**Problem:** Store coordinates remain null after geocoding attempt

**Solutions:**
1. Check store address is valid and complete
2. Verify Nominatim API is accessible
3. Check console logs for geocoding errors
4. Try manual geocoding via API endpoint

### Incorrect Coordinates
**Problem:** Geocoded coordinates don't match actual location

**Solutions:**
1. Update store address to be more specific
2. Include barangay, city, and region in address
3. Manually update coordinates in database if needed

### Geocoding Rate Limits
**Problem:** Geocoding fails with 429 Too Many Requests

**Solutions:**
1. Wait 1 second between geocoding requests
2. Use the migration script (includes rate limiting)
3. Consider alternative geocoding provider

## 📝 Console Logs

### Successful Geocoding
```
[Store Location] Geocoding store address: 123 Main St, Makati
[Store Location] Geocoded successfully: { lat: 14.5547, lng: 121.0244 }
```

### Using Cached Coordinates
```
[Store Location] Using cached coordinates: { lat: 14.5547, lng: 121.0244 }
```

### Fallback to Default
```
[Store Location] Geocoding failed, using default location
```

## 🎨 Code Examples

### LalamoveWidget Usage
```javascript
// Component automatically handles geocoding
<LalamoveWidget 
    deliveryAddress={address}
    items={cartItems}
    storeId={storeId}
    isSelected={shippingMethod === 'lalamove'}
    onQuoteReceived={handleQuote}
/>
```

### Manual Coordinate Update
```javascript
// Update store coordinates manually
await prisma.store.update({
    where: { id: storeId },
    data: {
        latitude: 14.5547,
        longitude: 121.0244
    }
});
```

## 📈 Monitoring

### Key Metrics to Track
- Geocoding success rate
- Cache hit rate (stores with cached coordinates)
- Average geocoding time
- Failed geocoding attempts

### SQL Queries for Monitoring
```sql
-- Geocoding coverage
SELECT 
    COUNT(*) as total_stores,
    COUNT(latitude) as geocoded_stores,
    ROUND(COUNT(latitude)::numeric / COUNT(*)::numeric * 100, 2) as coverage_percentage
FROM "Store";

-- Recent stores without coordinates
SELECT id, name, address, "createdAt"
FROM "Store"
WHERE latitude IS NULL
ORDER BY "createdAt" DESC
LIMIT 10;
```

## 🔐 Best Practices

1. **Always validate addresses** before geocoding
2. **Cache coordinates** to minimize API calls
3. **Handle errors gracefully** with fallback coordinates
4. **Log geocoding attempts** for debugging
5. **Monitor success rates** to identify issues
6. **Update coordinates** when store address changes

## 🚨 Important Notes

- **Nominatim Rate Limit:** Max 1 request per second
- **Coordinate Precision:** Float type provides ~1 meter accuracy
- **Fallback Coordinates:** Default to Manila (14.5505, 121.0260)
- **Cache Invalidation:** Manual (update when address changes)

## 📞 Support

For issues or questions:
1. Check console logs for error messages
2. Review this documentation
3. Check `STORE_GEOCODING_IMPLEMENTATION.html` for detailed info
4. Test geocoding endpoint directly

## 🔄 Migration Checklist

- [ ] Run database migration (add latitude/longitude fields)
- [ ] Generate Prisma client
- [ ] Run geocoding script for existing stores
- [ ] Verify coordinates in database
- [ ] Test quote generation with actual coordinates
- [ ] Test booking flow
- [ ] Monitor logs for errors
- [ ] Update production database

## 📚 Related Files

- `prisma/schema.prisma` - Store model definition
- `app/api/stores/[storeId]/geocode/route.js` - Geocoding endpoint
- `components/LalamoveWidget.jsx` - Quote generation with geocoding
- `app/api/shipping/lalamove/book/route.js` - Booking with coordinates
- `scripts/geocode-stores.js` - Batch geocoding script
- `STORE_GEOCODING_IMPLEMENTATION.html` - Full documentation
