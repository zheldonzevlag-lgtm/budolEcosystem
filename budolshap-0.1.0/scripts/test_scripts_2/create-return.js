const { createReturnRequest } = require('../lib/services/returnsService');

async function main() {
    try {
        const result = await createReturnRequest({
            orderId: 'cmj9nsdi9000ff4o4q578i1r1',
            userId: 'user_1765618421095_y8pbpkxha',
            reason: 'Damaged during shipping',
            type: 'REFUND_ONLY',
            refundAmount: 1
        });
        console.log('Return request created successfully:', result.id);
    } catch (error) {
        console.error('Error creating return request:', error.message);
    }
}

main().finally(() => process.exit());
