require('dotenv').config({ path: '.env.production' });
const { getShippingProvider } = require('../services/shippingFactory');

async function testLalamoveAPI() {
    try {
        const lalamove = getShippingProvider('lalamove');

        // Use a real booking ID from your orders
        const bookingId = '3379141263692874454'; // From your screenshot

        console.log('Fetching order details from Lalamove API...\n');
        console.log('Booking ID:', bookingId);
        console.log('='.repeat(60));

        const trackingData = await lalamove.trackOrder(bookingId);

        console.log('\n📦 TRACKING DATA RECEIVED:');
        console.log(JSON.stringify(trackingData, null, 2));

        console.log('\n👤 DRIVER INFO:');
        if (trackingData.driver) {
            console.log('Name:', trackingData.driver.name);
            console.log('Phone:', trackingData.driver.phone);
            console.log('Plate:', trackingData.driver.plateNumber);
            console.log('Vehicle:', trackingData.driver.vehicleType);
            console.log('Rating:', trackingData.driver.rating);
            console.log('Driver ID:', trackingData.driver.driverId);
        } else {
            console.log('❌ No driver info available');
        }

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Details:', error);
    }
}

testLalamoveAPI();
