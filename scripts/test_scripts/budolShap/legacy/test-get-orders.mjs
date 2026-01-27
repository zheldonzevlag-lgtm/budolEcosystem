import { getOrders } from '../../lib/services/ordersService.js';

async function test() {
    try {
        const storeId = 'cmjq9lbwh0001gpe0tj4xfue7';
        console.log(`Testing getOrders for storeId: ${storeId}`);

        const result = await getOrders({ storeId });
        console.log(`Found ${result.orders.length} orders.`);

    } catch (e) {
        console.error(e);
    }
}

test();
