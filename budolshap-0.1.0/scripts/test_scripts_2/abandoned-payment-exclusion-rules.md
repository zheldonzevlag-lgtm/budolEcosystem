# Abandoned Payment Exclusion Rules

## Payment Status Definitions

### Active/Valid Payment Statuses (Should be included in orders list)
- `paid` - Payment successfully completed
- `succeeded` - Payment gateway confirmation
- `cod_pending` - Cash on Delivery orders (payment pending delivery)
- `processing` - Payment is being processed

### Abandoned/Canceled Payment Statuses (Should be excluded from orders list)
- `cancelled` - Order manually canceled by user or system
- `failed` - Payment processing failed
- `awaiting_payment` - Payment abandoned (user closed payment window)
- `expired` - Payment session expired

## Exclusion Rules Implementation

### Rule 1: Basic Exclusion
Exclude orders where `paymentStatus` is one of: `cancelled`, `failed`, `awaiting_payment`, `expired`

### Rule 2: COD Exception
Include orders with `paymentMethod: 'COD'` even if `paymentStatus: 'awaiting_payment'` (COD orders start as awaiting_payment)

### Rule 3: Time-based Exclusion
For non-COD orders with `paymentStatus: 'awaiting_payment'`, exclude if created more than 30 minutes ago

### Rule 4: Cron Job Integration
System cron job (`cancel-unpaid-orders`) automatically cancels orders that are:
- Status: `PENDING`
- paymentStatus: `awaiting_payment`
- createdAt: older than 24 hours
- paymentMethod: NOT 'COD'

## API Filter Implementation

### Query Parameter: `excludeAbandonedPayments`
- Type: Boolean
- Default: `true` (exclude abandoned payments)
- When `true`: Applies all exclusion rules above
- When `false`: Shows all orders regardless of payment status

### Filter Logic (Pseudo-code)
```javascript
if (excludeAbandonedPayments === true) {
  whereClause.AND = [
    {
      OR: [
        { paymentStatus: { notIn: ['cancelled', 'failed', 'expired'] } },
        { paymentMethod: 'COD', paymentStatus: 'awaiting_payment' }
      ]
    },
    {
      NOT: {
        paymentStatus: 'awaiting_payment',
        paymentMethod: { not: 'COD' },
        createdAt: { lt: thirtyMinutesAgo }
      }
    }
  ];
}
```

## Frontend Implementation

### Buyer Orders Page
- Default behavior: `excludeAbandonedPayments=true`
- Filter option: "Show abandoned payments" toggle
- Visual indicators: Different styling for COD vs other payment methods

### Order Status Display
- COD orders: Show "Pending (COD)" badge
- Failed payments: Show "Payment Failed" with retry option
- Cancelled orders: Show "Cancelled" with reason

## Testing Scenarios

### Scenario 1: User closes payment window
- Order created with `paymentStatus: 'awaiting_payment'`
- Should not appear in orders list after 30 minutes
- Should be cancelled by cron job after 24 hours

### Scenario 2: Payment fails
- Order updated to `paymentStatus: 'failed'`
- Should not appear in orders list immediately
- User should see error message with retry option

### Scenario 3: COD order
- Order created with `paymentMethod: 'COD'`, `paymentStatus: 'awaiting_payment'`
- Should appear in orders list immediately
- Should not be cancelled by time-based rules

### Scenario 4: Manual cancellation
- User cancels order → `paymentStatus: 'cancelled'`
- Should not appear in orders list
- Cart items should be restored