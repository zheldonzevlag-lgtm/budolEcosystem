
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOrderVisibility() {
    console.log('--- Testing Order Visibility for Buyer Tabs ---');

    // Mock filters from app/(public)/orders/page.jsx
    const tabs = {
        'ALL': {},
        'TO_PAY': { isPaid: 'false', paymentStatus: '', status: 'ORDER_PLACED,PENDING_VERIFICATION' },
        'TO_SHIP': { status: 'PAID,PROCESSING' },
        'TO_RECEIVE': { status: 'SHIPPED,IN_TRANSIT' },
        'COMPLETED': { status: 'DELIVERED' },
        'CANCELLED': { isCancelledTab: 'true' },
        'RETURN_REFUND': { status: 'RETURN_REQUESTED,RETURN_APPROVED,RETURN_DISPUTED,REFUNDED' }
    };

    const testStatuses = [
        { status: 'ORDER_PLACED', isPaid: false, paymentStatus: 'pending', expectedTab: 'TO_PAY' },
        { status: 'PROCESSING', isPaid: true, paymentStatus: 'paid', expectedTab: 'TO_SHIP' },
        { status: 'PAID', isPaid: true, paymentStatus: 'paid', expectedTab: 'TO_SHIP' },
        { status: 'SHIPPED', isPaid: true, paymentStatus: 'paid', expectedTab: 'TO_RECEIVE' },
        { status: 'DELIVERED', isPaid: true, paymentStatus: 'paid', expectedTab: 'COMPLETED' },
        { status: 'CANCELLED', isPaid: false, paymentStatus: 'cancelled', expectedTab: 'CANCELLED' }
    ];

    const results = [];

    for (const test of testStatuses) {
        const matches = [];
        for (const [tabName, filters] of Object.entries(tabs)) {
            const where = {};
            if (filters.status) {
                if (filters.status.includes(',')) {
                    where.status = { in: filters.status.split(',').map(s => s.trim()) };
                } else {
                    where.status = filters.status;
                }
            }
            if (filters.isPaid !== undefined) {
                where.isPaid = filters.isPaid === 'true';
            }
            
            let isMatch = true;
            if (where.status) {
                if (where.status.in) {
                    if (!where.status.in.includes(test.status)) isMatch = false;
                } else {
                    if (where.status !== test.status) isMatch = false;
                }
            }
            if (where.isPaid !== undefined) {
                if (where.isPaid !== test.isPaid) isMatch = false;
            }
            if (filters.isCancelledTab) {
                isMatch = (test.status === 'CANCELLED' || test.paymentStatus === 'cancelled');
            }

            if (isMatch) matches.push(tabName);
        }
        results.push({
            Status: test.status,
            isPaid: test.isPaid,
            Matches: matches.join(', ')
        });
    }
    console.table(results);
}

testOrderVisibility()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
