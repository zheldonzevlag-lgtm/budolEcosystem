/**
 * Test Lalamove Tracking and Driver Information Display
 * 
 * This script tests:
 * 1. Fetching order details with Lalamove tracking
 * 2. Syncing Lalamove data manually
 * 3. Verifying driver information is displayed correctly
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testLalamoveTracking() {
    console.log('🧪 Testing Lalamove Tracking & Driver Information\n');

    // Get order ID from command line or use default
    const orderId = process.argv[2];

    if (!orderId) {
        console.error('❌ Please provide an order ID as argument');
        console.log('Usage: node test-lalamove-tracking.js <orderId>');
        process.exit(1);
    }

    try {
        // Step 1: Fetch order details
        console.log('📦 Step 1: Fetching order details...');
        const orderResponse = await fetch(`${BASE_URL}/api/orders/${orderId}`);

        if (!orderResponse.ok) {
            throw new Error(`Failed to fetch order: ${orderResponse.status}`);
        }

        const order = await orderResponse.json();
        console.log('✅ Order fetched successfully');
        console.log('   Order ID:', order.id);
        console.log('   Status:', order.status);
        console.log('   Shipping Provider:', order.shipping?.provider);

        if (order.shipping?.provider !== 'lalamove') {
            console.log('⚠️  This is not a Lalamove order. Test aborted.');
            return;
        }

        console.log('   Lalamove Booking ID:', order.shipping.bookingId);
        console.log('   Lalamove Status:', order.shipping.status);
        console.log('   Share Link:', order.shipping.shareLink ? '✓ Present' : '✗ Missing');

        // Step 2: Check driver information
        console.log('\n👤 Step 2: Checking driver information...');
        if (order.shipping.driverInfo) {
            console.log('✅ Driver information found:');
            console.log('   Name:', order.shipping.driverInfo.name || '✗ Missing');
            console.log('   Phone:', order.shipping.driverInfo.phone || '✗ Missing');
            console.log('   Plate Number:', order.shipping.driverInfo.plateNumber || '✗ Missing');
            console.log('   Vehicle Type:', order.shipping.driverInfo.vehicleType || '✗ Missing');
            console.log('   Rating:', order.shipping.driverInfo.rating || '✗ Missing');
            console.log('   Photo:', order.shipping.driverInfo.photo ? '✓ Present' : '✗ Missing');
        } else {
            console.log('⚠️  No driver information available yet');
        }

        // Step 3: Check location data
        console.log('\n📍 Step 3: Checking location data...');
        if (order.shipping.location) {
            console.log('✅ Location data found:');
            console.log('   Latitude:', order.shipping.location.lat);
            console.log('   Longitude:', order.shipping.location.lng);
            console.log('   Updated At:', order.shipping.location.updatedAt);
        } else {
            console.log('⚠️  No location data available');
        }

        // Step 4: Sync with Lalamove API
        console.log('\n🔄 Step 4: Syncing with Lalamove API...');
        const syncResponse = await fetch(`${BASE_URL}/api/orders/${orderId}/sync-lalamove`, {
            method: 'POST'
        });

        if (!syncResponse.ok) {
            const error = await syncResponse.json();
            console.log('⚠️  Sync failed:', error.error);
            console.log('   Details:', error.details);
        } else {
            const syncResult = await syncResponse.json();
            console.log('✅ Sync successful');
            console.log('   Updated Status:', syncResult.trackingData.status);

            if (syncResult.trackingData.driverInfo) {
                console.log('   Driver Info Updated:');
                console.log('     Name:', syncResult.trackingData.driverInfo.name);
                console.log('     Phone:', syncResult.trackingData.driverInfo.phone);
                console.log('     Plate:', syncResult.trackingData.driverInfo.plateNumber);
            }
        }

        // Step 5: Check timeline
        console.log('\n📋 Step 5: Checking event timeline...');
        if (order.shipping.timeline && order.shipping.timeline.length > 0) {
            console.log(`✅ Found ${order.shipping.timeline.length} timeline events:`);
            order.shipping.timeline.forEach((event, index) => {
                console.log(`   ${index + 1}. ${event.event} (${event.status}) - ${new Date(event.timestamp).toLocaleString()}`);
                if (event.driverInfo) {
                    console.log(`      Driver: ${event.driverInfo.name || 'Unknown'}`);
                }
            });
        } else {
            console.log('⚠️  No timeline events found');
        }

        console.log('\n✅ Test completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   - Order Status:', order.status);
        console.log('   - Lalamove Status:', order.shipping.status);
        console.log('   - Driver Assigned:', order.shipping.driverInfo ? 'Yes' : 'No');
        console.log('   - Location Available:', order.shipping.location ? 'Yes' : 'No');
        console.log('   - Share Link:', order.shipping.shareLink ? 'Yes' : 'No');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the test
testLalamoveTracking();
