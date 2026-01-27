
const userId = 'user_1766992359264_b0a6p5zfo';
const url = `http://localhost:3000/api/orders?userId=${userId}&page=1&limit=10`;

async function test() {
    console.log('Fetching:', url);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Orders Count:', data.orders?.length);
        console.log('Total:', data.pagination?.total);
        if (data.orders?.length > 0) {
            console.log('First Order Status:', data.orders[0].status);
        }
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

test();
