
// Use native fetch if available (Node 18+), otherwise require node-fetch
if (!global.fetch) {
    try {
        global.fetch = require('node-fetch');
    } catch (e) {
        console.error('Fetch not available. Please ensure you are using Node 18+ or install node-fetch.');
        process.exit(1);
    }
}

async function testGeocode() {
    console.log('Testing Geocode API...');
    const baseUrl = 'http://localhost:3000'; // Adjust if needed

    try {
        // Test 1: Reverse Geocode (Luneta Park)
        console.log('\nTest 1: Reverse Geocode (Luneta Park)');
        const lat = 14.5826;
        const lng = 120.9787;
        const url1 = `${baseUrl}/api/system/geocode?lat=${lat}&lng=${lng}`;
        console.log(`Fetching: ${url1}`);
        const res1 = await fetch(url1);
        if (res1.ok) {
            const data1 = await res1.json();
            console.log('Success:', data1.display);
            console.log('Coordinates:', data1.coordinates);
        } else {
            console.error('Error:', res1.status, await res1.text());
        }

        // Test 2: Forward Geocode (Query)
        console.log('\nTest 2: Forward Geocode (Makati)');
        const q = 'Makati, Philippines';
        const url2 = `${baseUrl}/api/system/geocode?q=${encodeURIComponent(q)}`;
        console.log(`Fetching: ${url2}`);
        const res2 = await fetch(url2);
        if (res2.ok) {
            const data2 = await res2.json();
            if (Array.isArray(data2)) {
                console.log(`Success: Found ${data2.length} results`);
                if (data2.length > 0) {
                    console.log('First Result:', data2[0].display);
                    console.log('Coordinates:', data2[0].coordinates);
                }
            } else {
                console.log('Success (Single Object):', data2.display);
                console.log('Coordinates:', data2.coordinates);
            }
        } else {
            console.error('Error:', res2.status, await res2.text());
        }

        // Test 3: Verify Provider Configuration (Settings Check)
        console.log('\nTest 3: Provider Configuration Check');
        const settingsRes = await fetch(`${baseUrl}/api/system/settings`);
        if (settingsRes.ok) {
            const settings = await settingsRes.json();
            console.log('Current Map Provider:', settings.mapProvider);
            console.log('Enabled Providers:', settings.enabledMapProviders);
            console.log('Google Maps Key Present:', !!settings.googleMapsApiKey);
            console.log('Radar Key Present:', !!settings.radarApiKey);
            console.log('Geoapify Key Present:', !!settings.geoapifyApiKey);
        } else {
            console.error('Failed to fetch settings');
        }

    } catch (err) {
        console.error('Test failed:', err.message);
        console.log('Note: Ensure the server is running on localhost:3000');
    }
}

async function checkServerHealth() {
    const baseUrl = 'http://localhost:3000';
    console.log(`\nChecking server health at ${baseUrl}/api/system/settings...`);
    try {
        const res = await fetch(`${baseUrl}/api/system/settings`);
        if (res.ok) {
            console.log('Server is healthy and responding.');
        } else {
            console.log(`Server responded with ${res.status} ${res.statusText}`);
        }
    } catch (e) {
        console.log('Server is NOT reachable:', e.message);
    }
}

// Run health check first, then test geocode
checkServerHealth().then(() => {
    console.log('--------------------------------------------------');
    testGeocode();
});
