# Map Loading Issue - Cache Fix Guide

## Problem
Maps only load correctly in incognito mode but not in regular browser sessions.

## Root Cause
This is a **browser caching issue**. Your browser is caching old versions of:
- JavaScript files
- CSS files
- Service workers
- Local storage data
- Cookies

Incognito mode works because it starts with a clean slate (no cache, no cookies).

## Solutions Applied

### 1. ✅ Added Cache-Busting to Iframes
**File**: `components/LalamoveTracking.jsx`

Added `key={shareLink}` prop to force React to remount the iframe when the URL changes:
```jsx
<iframe
    key={shareLink}  // ← Forces remount on URL change
    src={shareLink}
    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    // ... other props
/>
```

### 2. ✅ Added Sandbox Attribute
Added proper sandbox permissions to allow Lalamove maps to function:
```jsx
sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
```

### 3. ✅ Updated Next.js Cache Headers
**File**: `next.config.mjs`

Added cache control headers to prevent aggressive caching:
```javascript
async headers() {
    return [
        {
            source: '/:path*',
            headers: [
                {
                    key: 'Cache-Control',
                    value: 'public, max-age=0, must-revalidate',
                },
            ],
        },
    ];
}
```

## User Actions Required

### Step 1: Clear Browser Cache (Recommended)

#### Chrome/Edge:
1. Press `Ctrl + Shift + Delete`
2. Select "All time" for time range
3. Check:
   - ✅ Cached images and files
   - ✅ Cookies and other site data
4. Click "Clear data"

#### Firefox:
1. Press `Ctrl + Shift + Delete`
2. Select "Everything" for time range
3. Check:
   - ✅ Cache
   - ✅ Cookies
4. Click "Clear Now"

### Step 2: Hard Refresh the Page

After clearing cache:
1. Go to your order page
2. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. This forces a hard reload bypassing cache

### Step 3: Disable Browser Extensions (If Still Not Working)

Some extensions can interfere with map loading:
- Ad blockers (uBlock Origin, AdBlock Plus)
- Privacy extensions (Privacy Badger, Ghostery)
- Script blockers (NoScript)

**Temporary disable** these extensions and test again.

### Step 4: Check Service Workers

1. Open DevTools (`F12`)
2. Go to "Application" tab
3. Click "Service Workers" in left sidebar
4. Click "Unregister" for any service workers from your domain
5. Refresh the page

## Quick Fix for Testing

If you need to test immediately without clearing cache:

### Option A: Use Incognito/Private Mode
- Chrome: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`
- Edge: `Ctrl + Shift + N`

### Option B: Disable Cache in DevTools
1. Open DevTools (`F12`)
2. Go to "Network" tab
3. Check "Disable cache" checkbox
4. Keep DevTools open while testing

## Verification Steps

After applying fixes and clearing cache:

1. ✅ Open order page in normal browser
2. ✅ Check if Lalamove map loads
3. ✅ Verify driver information displays
4. ✅ Test on different browsers (Chrome, Firefox, Edge)
5. ✅ Test on mobile devices

## Why This Happens

### Browser Caching Strategy
Browsers aggressively cache resources to improve performance:
- JavaScript files cached for hours/days
- CSS files cached for hours/days
- Iframe content can be cached
- Service workers cache entire pages

### Development vs Production
During development, you make frequent changes but browser serves old cached versions, causing:
- Old JavaScript running
- Old styles applying
- Stale iframe content
- Outdated service worker scripts

## Prevention for Future

### For Development:
1. Always keep DevTools open with "Disable cache" checked
2. Use incognito mode for testing
3. Clear cache after major deployments

### For Production:
The cache headers we added will help, but users may still need to:
- Hard refresh after updates
- Clear cache if experiencing issues

## Technical Details

### Cache-Control Header Explanation
```
public, max-age=0, must-revalidate
```
- `public`: Can be cached by browsers and CDNs
- `max-age=0`: Cache expires immediately
- `must-revalidate`: Must check with server before using cached version

### Iframe Sandbox Permissions
```
allow-same-origin allow-scripts allow-popups allow-forms
```
- `allow-same-origin`: Allows iframe to access its own origin
- `allow-scripts`: Allows JavaScript execution
- `allow-popups`: Allows opening new windows
- `allow-forms`: Allows form submission

## Deployment

After making these changes:

```bash
# Commit changes
git add .
git commit -m "Fix map loading cache issues"
git push origin main

# Deploy to Vercel
vercel --prod
```

## Testing Checklist

- [ ] Clear browser cache completely
- [ ] Hard refresh the page (Ctrl+Shift+R)
- [ ] Test in normal browser window
- [ ] Test in incognito mode
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Verify map loads correctly
- [ ] Verify driver info displays
- [ ] Check console for errors

## Common Issues & Solutions

### Issue: Map still doesn't load
**Solution**: 
1. Check browser console for errors (F12 → Console)
2. Verify shareLink is valid in network tab
3. Check if Lalamove tracking link is expired

### Issue: "Page not found" in iframe
**Solution**: 
- This is a Lalamove API issue, not a cache issue
- The tracking link may have expired
- The order may be completed
- Try creating a new test order

### Issue: Works in incognito but not normal mode
**Solution**: 
- Clear ALL browsing data (not just cache)
- Unregister service workers
- Disable all browser extensions
- Try a different browser

## Support

If issues persist after following all steps:
1. Check Vercel deployment logs
2. Check browser console errors
3. Verify environment variables are set
4. Test with a fresh Lalamove order

---

**Status**: ✅ Fixes Applied  
**Next Step**: Clear browser cache and hard refresh  
**Expected Result**: Maps should load in normal browser mode
