
import { getOrders } from '../lib/services/ordersService.js'

async function test() {
    const userId = 'user_1766992359264_b0a6p5zfo'
    const filters = {
        userId: userId,
        page: '1',
        limit: '10'
    }

    console.log('Testing getOrders with filters:', filters)
    const result = await getOrders(filters)
    console.log('Result orders count:', result.orders.length)
    console.log('Result total:', result.pagination.total)

    if (result.orders.length > 0) {
        console.log('First order ID:', result.orders[0].id)
        console.log('First order items count:', result.orders[0].items?.length || result.orders[0].orderItems?.length)
    }
}

test().catch(console.error)
