// scripts/test-webhook-parser.js

/**
 * Extraction Logic (Mirrored from /app/api/shipping/lalamove/webhook/route.js)
 * This allows us to unit test the logic without mocking Next.js Request or Prisma
 */
const extractData = (body) => {
    const eventType = body.eventType;
    const data = body.data || {};

    // Logic 1: Order ID Extraction (Handling nesting variations)
    const lalamoveOrderId = data?.order?.orderId || data?.orderId;

    // Logic 2: Driver Info Extraction
    let driverInfo = {};
    if (data.driver) {
        const driverData = data.driver;
        driverInfo = {
            name: driverData.name,
            phone: driverData.phone,
            plateNumber: driverData.plateNumber,
            photo: driverData.photoUrl || driverData.photo,
            vehicleType: driverData.vehicleType,
            rating: driverData.rating
        };
    }

    // Logic 3: Location Extraction (Handling naming variations)
    // Checks data.location (standard) OR data.driverLocation (some event types)
    const locationData = data.location || data.driverLocation;
    let locationInfo = null;
    if (locationData) {
        locationInfo = {
            lat: locationData.lat,
            lng: locationData.lng
        };
    }

    return { lalamoveOrderId, driverInfo, locationInfo, eventType };
};

// ------------------------------------------------------------------
// Unit Tests
// ------------------------------------------------------------------
const runTests = () => {
    console.log('🧪 Running Webhook Parser Unit Tests...\n');
    let passed = 0;
    let failed = 0;

    const assert = (name, actual, expected) => {
        // Simple deep equality check for primitives and basic objects
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);

        if (actualStr === expectedStr) {
            console.log(`✅ ${name}: PASSED`);
            passed++;
        } else {
            console.error(`❌ ${name}: FAILED`);
            console.error('   Expected:', expected);
            console.error('   Actual:  ', actual);
            failed++;
        }
    };

    // Test Case 1: Standard DRIVER_ASSIGNED payload
    const payload1 = {
        eventType: 'DRIVER_ASSIGNED',
        data: {
            order: { orderId: '123' },
            driver: { name: 'John', phone: '0917' },
            location: { lat: '1.0', lng: '2.0' }
        }
    };
    const res1 = extractData(payload1);
    assert('T1. Standard OrderID', res1.lalamoveOrderId, '123');
    assert('T1. Driver Name', res1.driverInfo.name, 'John');
    assert('T1. Location Lat', res1.locationInfo.lat, '1.0');

    // Test Case 2: Flattened orderId (seen in some events)
    const payload2 = {
        eventType: 'STATUS_UPDATE',
        data: {
            orderId: '456',
            driver: { name: 'Doe' }
        }
    };
    const res2 = extractData(payload2);
    assert('T2. Flat OrderId', res2.lalamoveOrderId, '456');

    // Test Case 3: driverLocation field name
    const payload3 = {
        eventType: 'LOC_UPDATE',
        data: {
            orderId: '789',
            driverLocation: { lat: '10.5', lng: '20.5' }
        }
    };
    const res3 = extractData(payload3);
    assert('T3. DriverLocation lat', res3.locationInfo.lat, '10.5');

    // Test Case 4: Photo URL vs Photo
    const payload4 = {
        data: {
            driver: { photoUrl: 'http://img.com/1.jpg' }
        }
    };
    const res4 = extractData(payload4);
    assert('T4. photoUrl mapping', res4.driverInfo.photo, 'http://img.com/1.jpg');

    // Test Case 5: Empty Payload
    const payload5 = {
        eventType: 'PING',
        data: {}
    };
    const res5 = extractData(payload5);
    assert('T5. Empty Data Safety', res5.lalamoveOrderId, undefined);

    console.log(`\n----------------------------------------`);
    console.log(`Summary: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
};

runTests();
