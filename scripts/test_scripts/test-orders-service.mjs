
import { getOrders, getOrderById, createOrder, updateOrderStatus } from '../../budolshap-0.1.0/lib/services/ordersService.js';

async function testExports() {
    console.log('--- Testing Orders Service Exports ---');
    console.log('getOrders:', typeof getOrders);
    console.log('getOrderById:', typeof getOrderById);
    console.log('createOrder:', typeof createOrder);
    console.log('updateOrderStatus:', typeof updateOrderStatus);

    if (
        typeof getOrders === 'function' &&
        typeof getOrderById === 'function' &&
        typeof createOrder === 'function' &&
        typeof updateOrderStatus === 'function'
    ) {
        console.log('✅ All functions exported correctly.');
    } else {
        console.error('❌ Some functions are missing or not exported correctly.');
        process.exit(1);
    }
}

testExports().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
