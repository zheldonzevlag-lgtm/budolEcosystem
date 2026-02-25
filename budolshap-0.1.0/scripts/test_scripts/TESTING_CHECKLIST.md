# ✅ Testing Checklist

## Before Testing
- [ ] Vercel deployment completed (check dashboard)
- [ ] Environment variables set (LALAMOVE_WEBHOOK_SECRET)
- [ ] Webhook URL configured in Lalamove Portal

## Quick Test
```bash
node quick-test.js
```

- [ ] Script runs without errors
- [ ] Webhook sent successfully (200 OK)
- [ ] Driver data found in database
- [ ] Location data found in database

## Database Verification
```bash
node view-shipping-data.js
```

- [ ] Driver name: TestDriver 34567
- [ ] Driver phone: +6310012345467
- [ ] Plate number: VP9946964
- [ ] Vehicle type: MOTORCYCLE
- [ ] Rating: 4.8
- [ ] Location lat: 22.329804362923516
- [ ] Location lng: 114.15004381376369

## UI Verification
Visit: https://budulshap.vercel.app/orders/cmit4cuag0002jx04sbzql9ox

- [ ] Driver name displays
- [ ] Driver photo/avatar shows
- [ ] Phone number visible
- [ ] Call button works
- [ ] Plate number displays
- [ ] Vehicle type badge shows
- [ ] Rating stars display
- [ ] GPS coordinates show
- [ ] Live tracking map loads
- [ ] Lalamove button works

## Production Test
- [ ] Place new test order
- [ ] Wait for driver assignment
- [ ] Check order tracking page
- [ ] Verify all driver info displays
- [ ] Test on mobile device
- [ ] Test on desktop browser

## Vercel Logs Check
- [ ] Go to Vercel dashboard
- [ ] Filter logs for webhook endpoint
- [ ] Verify "Driver info updated" message
- [ ] Verify "Location updated" message
- [ ] No errors in logs

## Final Verification
- [ ] Driver info persists after page refresh
- [ ] Location updates in real-time
- [ ] Timeline shows driver assignment event
- [ ] Email notification sent (if configured)
- [ ] Status updated correctly

---

## If Any Checkbox Fails

1. Check Vercel logs for errors
2. Run `node debug-booking-id.js`
3. Verify webhook URL in Lalamove Portal
4. Check webhook secret matches
5. Review TESTING_GUIDE.md for troubleshooting

---

**Date**: _______________  
**Tester**: _______________  
**Result**: ⬜ PASS  ⬜ FAIL  
**Notes**: 
_______________________________________
_______________________________________
_______________________________________
