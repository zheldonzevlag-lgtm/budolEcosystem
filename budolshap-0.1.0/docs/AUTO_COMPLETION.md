# Order Auto-Completion System

## Overview

The auto-completion system automatically marks orders as `COMPLETED` after a 7-day buyer confirmation period, following industry standards set by Shopee and Lazada.

## How It Works

### 1. Scheduling (Automatic)
When an order is delivered (status changes to `DELIVERED`), the system automatically schedules it for auto-completion 7 days later by setting the `autoCompleteAt` field.

**Triggered by:** Lalamove COMPLETED webhook  
**File:** `/app/api/webhooks/lalamove/route.js`  
**Field Set:** `autoCompleteAt` = current date + 7 days

### 2. Processing (Daily Cron Job)
Every day at midnight (UTC), a cron job runs to process orders that have passed their auto-completion date.

**Cron Schedule:** `0 0 * * *` (Daily at midnight UTC)  
**Endpoint:** `/api/cron/auto-complete-orders`  
**Configuration:** `vercel.json`

### 3. Completion
For each eligible order, the system:
1. Updates status from `DELIVERED` to `COMPLETED`
2. Sets `completedAt` timestamp
3. Sends completion email to customer
4. Logs the completion

## Files Created

### Core Utility
- **`/lib/orderAutoComplete.js`**
  - `scheduleAutoComplete(orderId, days)` - Schedule an order for auto-completion
  - `processAutoCompletions()` - Process all eligible orders
  - `getPendingAutoCompletions(limit)` - Get list of pending completions
  - `cancelAutoComplete(orderId)` - Cancel scheduled auto-completion

### API Endpoint
- **`/app/api/cron/auto-complete-orders/route.js`**
  - `GET` - Called by Vercel cron (requires CRON_SECRET)
  - `POST` - Manual trigger for testing

### Configuration
- **`vercel.json`** - Cron job configuration

### Testing
- **`/scripts/test-auto-complete.js`** - Test script for verification

## Environment Variables

### Required for Production
```env
CRON_SECRET=your-secret-key-here
```

**Purpose:** Authenticates cron job requests to prevent unauthorized access

**Setup:**
1. Generate a secure random string
2. Add to Vercel environment variables
3. Cron job will include this in Authorization header

## Testing

### Local Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Run test script:**
   ```bash
   node scripts/test-auto-complete.js
   ```

3. **Manual trigger (for testing):**
   ```bash
   # POST request (no auth required in development)
   curl -X POST http://localhost:3000/api/cron/auto-complete-orders
   ```

### Testing with Real Data

1. **Find a DELIVERED order:**
   ```sql
   SELECT id, status, "deliveredAt", "autoCompleteAt"
   FROM "Order"
   WHERE status = 'DELIVERED'
   LIMIT 5;
   ```

2. **Set autoCompleteAt to past (for testing):**
   ```sql
   UPDATE "Order"
   SET "autoCompleteAt" = NOW() - INTERVAL '1 day'
   WHERE id = 'your-order-id-here'
   AND status = 'DELIVERED';
   ```

3. **Trigger auto-completion:**
   ```bash
   curl -X POST http://localhost:3000/api/cron/auto-complete-orders
   ```

4. **Verify completion:**
   ```sql
   SELECT id, status, "completedAt"
   FROM "Order"
   WHERE id = 'your-order-id-here';
   ```

## Production Deployment

### Vercel Setup

1. **Deploy code:**
   ```bash
   git add .
   git commit -m "feat: implement auto-completion system"
   git push origin main
   ```

2. **Add environment variable:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add `CRON_SECRET` with a secure random value
   - Redeploy if needed

3. **Verify cron job:**
   - Go to Vercel Dashboard → Project → Cron Jobs
   - You should see: `/api/cron/auto-complete-orders` scheduled for `0 0 * * *`

### Monitoring

**Check cron execution logs:**
- Vercel Dashboard → Project → Deployments → [Latest] → Functions
- Look for `/api/cron/auto-complete-orders` logs

**Monitor auto-completions:**
```javascript
// Get pending auto-completions
import { getPendingAutoCompletions } from '@/lib/orderAutoComplete';

const pending = await getPendingAutoCompletions(10);
console.log('Pending auto-completions:', pending);
```

## API Reference

### GET /api/cron/auto-complete-orders

**Purpose:** Process auto-completions (called by Vercel cron)

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-12-03T00:00:00.000Z",
  "results": {
    "totalOrders": 5,
    "completed": 5,
    "failed": 0,
    "errors": []
  }
}
```

### POST /api/cron/auto-complete-orders

**Purpose:** Manual trigger for testing

**Response:** Same as GET

## Error Handling

### Email Failures
- Email failures don't prevent order completion
- Errors are logged but process continues
- Customer can still see completion in their orders

### Database Errors
- Individual order failures don't stop batch processing
- Failed orders are logged in results.errors
- Can be retried on next cron run

### Cron Failures
- Vercel automatically retries failed cron jobs
- Check logs for error details
- Manual trigger available via POST endpoint

## Best Practices

### 1. Don't Modify autoCompleteAt Manually
The system automatically sets this field. Manual changes may cause unexpected behavior.

### 2. Use cancelAutoComplete() for Returns
If customer requests a return, cancel auto-completion:
```javascript
import { cancelAutoComplete } from '@/lib/orderAutoComplete';
await cancelAutoComplete(orderId);
```

### 3. Monitor Cron Logs
Regularly check Vercel logs to ensure cron is running successfully.

### 4. Test Before Production
Always test auto-completion with test orders before deploying to production.

## Troubleshooting

### Cron Not Running
- Check Vercel Dashboard → Cron Jobs
- Verify `vercel.json` is committed and deployed
- Check environment variables are set

### Orders Not Completing
- Verify `autoCompleteAt` is set and in the past
- Check order status is `DELIVERED`
- Review cron execution logs for errors

### Email Not Sending
- Check email service configuration
- Review email logs
- Email failures won't prevent completion

## Future Enhancements

Potential improvements:
- Admin dashboard for monitoring auto-completions
- Configurable completion period (currently fixed at 7 days)
- Notification before auto-completion (e.g., 1 day reminder)
- Batch email sending optimization
- Metrics and analytics for completion rates

## Support

For issues or questions:
1. Check Vercel logs for error details
2. Review this documentation
3. Test with manual trigger endpoint
4. Check database for order status and timestamps
