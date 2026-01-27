const BASE_URL = 'http://localhost:3000';
const USER_ID = 'user_1766992359264_b0a6p5zfo'; // Using a known user ID

async function testApiExclusion() {
    console.log('--- Testing API Abandoned Payment Exclusion (v524) ---');

    try {
        // 1. Fetch with exclusion ENABLED (default)
        console.log('\nTesting with excludeAbandonedPayments=true (default)...');
        const resExcl = await fetch(`${BASE_URL}/api/orders?userId=${USER_ID}&excludeAbandonedPayments=true`);
        if (!resExcl.ok) throw new Error(`API error: ${resExcl.status}`);
        const dataExcl = await resExcl.json();
        
        console.log(`Orders found: ${dataExcl.orders?.length || 0}`);
        
        const abandonedInExcluded = dataExcl.orders?.filter(o => 
            ['cancelled', 'failed', 'expired'].includes(o.paymentStatus)
        );
        
        console.log(`Abandoned orders found in "Clean" list: ${abandonedInExcluded?.length || 0}`);
        if (abandonedInExcluded?.length === 0) {
            console.log('✅ PASS: No abandoned orders found in excluded list.');
        } else {
            console.log('❌ FAIL: Abandoned orders leaked into excluded list.');
            abandonedInExcluded.forEach(o => console.log(`- Order ${o.id}: status=${o.paymentStatus}`));
        }

        // 2. Fetch with exclusion DISABLED
        console.log('\nTesting with excludeAbandonedPayments=false...');
        const resAll = await fetch(`${BASE_URL}/api/orders?userId=${USER_ID}&excludeAbandonedPayments=false`);
        if (!resAll.ok) throw new Error(`API error: ${resAll.status}`);
        const dataAll = await resAll.json();
        
        console.log(`Orders found: ${dataAll.orders?.length || 0}`);
        
        const abandonedInAll = dataAll.orders?.filter(o => 
            ['cancelled', 'failed', 'expired'].includes(o.paymentStatus)
        );
        
        console.log(`Abandoned orders found in "All" list: ${abandonedInAll?.length || 0}`);
        
        if (dataAll.orders?.length >= dataExcl.orders?.length) {
            console.log('✅ PASS: "All" list count is greater or equal to "Clean" list.');
        } else {
            console.log('❌ FAIL: "All" list has fewer orders than "Clean" list.');
        }

    } catch (error) {
        console.error('Test failed:', error.message);
        console.log('Note: Ensure the local server is running at http://localhost:3000');
    }
}

testApiExclusion();