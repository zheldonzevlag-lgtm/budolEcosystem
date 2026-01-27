
async function testOrderVisibility() {
    console.log('🚀 Starting Order Visibility Test (v489)');

    try {
        console.log(`✅ Using mock test order`);
        
        const statusesToTest = ['PAID', 'PROCESSING'];

        for (const testStatus of statusesToTest) {
            console.log(`\n--- Testing Status: ${testStatus} ---`);
            
            // Mock the order status for testing logic
            const mockOrder = {
                id: 'test-order-id',
                status: testStatus,
                isPaid: true,
                shipping: null // Simulate no booking yet
            };

            // 2. Simulate the filter logic from (public)/orders/page.jsx (Buyer)
            // Based on the filters defined in useMemo in orders/page.jsx:
            // case 'TO_SHIP': return { status: 'PAID,PROCESSING' };
            
            const buyerVisibleInToShip = ['PAID', 'PROCESSING'].includes(mockOrder.status);

            console.log('📱 Buyer Dashboard (My Orders):');
            console.log(`${buyerVisibleInToShip ? '✅' : '❌'} Visible in "To Ship" tab`);

            // 3. Simulate the filter logic from store/orders/page.jsx (Seller)
            const getDeliveryStatus = (o) => {
                if (['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_DISPUTED', 'REFUNDED'].includes(o.status)) return 'RETURN';
                if (o.status === 'DELIVERED' || o.status === 'COMPLETED') return 'DELIVERED';
                if (o.status === 'CANCELLED' || (['PROCESSING', 'ORDER_PLACED', 'PAID'].includes(o.status) && o.shipping?.failureReason)) return 'CANCELLED';
                
                if (o.shipping?.bookingId) {
                    return 'TO_SHIP';
                }

                if (!o.shipping?.bookingId) {
                    if (o.status === 'PAID' || o.status === 'PROCESSING') return 'NEEDS_BOOKING';
                    return o.status;
                }
                return o.status;
            };

            const deliveryStatus = getDeliveryStatus(mockOrder);
            console.log(`\n🏪 Seller Dashboard:`);
            console.log(`Delivery Status: ${deliveryStatus}`);
            console.log(`${deliveryStatus === 'NEEDS_BOOKING' ? '✅' : '❌'} Visible in "Needs Booking" section`);

            if (buyerVisibleInToShip && deliveryStatus === 'NEEDS_BOOKING') {
                console.log(`✨ Status ${testStatus} is correctly synchronized between Buyer and Seller!`);
            } else {
                console.log(`⚠️ Status ${testStatus} has synchronization issues.`);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testOrderVisibility();
