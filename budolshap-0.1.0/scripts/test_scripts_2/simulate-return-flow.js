
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orderId = 'cmjdpzqgj0005f40gzkyskp5f';
    const buyerId = 'user_1765710876026_xcy2xebnl';
    const storeId = 'cmj438qyq0005l704fu4kjele';

    console.log("--- 1. Buyer Initiating Return Request ---");

    // --- Logic from createReturnRequest ---
    const returnReq = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { store: true }
        });

        if (!order) throw new Error('Order not found');

        // Create Return
        const r = await tx.return.create({
            data: {
                orderId,
                reason: 'Did not receive the order',
                type: 'REFUND_ONLY',
                refundAmount: order.total,
                status: 'PENDING',
                deadline: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000))
            }
        });

        // Update Order
        await tx.order.update({
            where: { id: orderId },
            data: { status: 'RETURN_REQUESTED' }
        });

        return r;
    });

    console.log("Return Request Created:");
    console.log(`ID: ${returnReq.id}`);
    console.log(`Status: ${returnReq.status}`);

    console.log("\n--- 2. Seller Accepting Refund ---");

    // --- Logic from respondToReturn (ACCEPT) ---
    const updatedReturn = await prisma.$transaction(async (tx) => {
        const returnRequest = await tx.return.findUnique({
            where: { id: returnReq.id },
            include: { order: { include: { store: { include: { wallet: true } } } } }
        });

        let newStatus = 'REFUNDED'; // For REFUND_ONLY + ACCEPT

        // Escrow Refund Logic
        const wallet = returnRequest.order.store.wallet;
        if (wallet) {
            console.log(`   [Wallet] Deducting ${returnRequest.refundAmount} from wallet ${wallet.id}...`);
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: returnRequest.refundAmount } }
            });

            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount: returnRequest.refundAmount,
                    type: 'DEBIT',
                    description: `Refund for Order #${returnRequest.orderId} (Return: ${returnRequest.id})`
                }
            });
        } else {
            console.log("   [Wallet] No wallet found for store.");
        }

        const updated = await tx.return.update({
            where: { id: returnReq.id },
            data: {
                status: newStatus,
                sellerAction: 'ACCEPT',
                sellerReason: 'Refund approved via script',
                updatedAt: new Date()
            }
        });

        await tx.order.update({
            where: { id: returnRequest.orderId },
            data: { status: 'REFUNDED' }
        });

        return updated;
    });

    console.log("Return Processed:");
    console.log(`New Status: ${updatedReturn.status}`);

    const finalOrder = await prisma.order.findUnique({ where: { id: orderId } });
    console.log(`Final Order Status: ${finalOrder.status}`);

    if (finalOrder.status === 'REFUNDED') {
        console.log("\n✅ SUCCESS: Order was successfully refunded via 'Accept & Refund' logic.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
