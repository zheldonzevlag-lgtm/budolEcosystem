
const fetch = require('node-fetch'); // Ensure node-fetch is available or use native fetch in node 18+

async function testGeocode() {
    const addresses = [
        "NCR - National Capital Region, Makati City",
        "NCR - National Capital Region, Makati City, Philippines",
        "Makati City, Philippines"
    ];

    for (const addr of addresses) {
        console.log(`Testing: "${addr}"`);
        const query = encodeURIComponent(addr);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`, {
                headers: {
                    'User-Agent': 'BudolShap/1.0'
                }
            });
            const data = await res.json();
            if (data && data.length > 0) {
                console.log(`✅ Success: ${data[0].lat}, ${data[0].lon}`);
            } else {
                console.log(`❌ Failed`);
            }
        } catch (e) {
            console.error(`Error: ${e.message}`);
        }
        // Wait 1s to be nice to Nominatim
        await new Promise(r => setTimeout(r, 1000));
    }
}

testGeocode();
