import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, amount, provider, description } = body;
        
        if (!userId || !amount) {
            return NextResponse.json({ error: "userId and amount are required" }, { status: 400 });
        }

        const referenceId = `CI-${uuidv4().slice(0, 8).toUpperCase()}`;

        // 1. Fetch user to check KYC limits
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true }
        });

        if (!user) throw new Error("User not found");

        if (user.kycTier === 'BASIC') {
            const currentBalance = user.wallet ? Number(user.wallet.balance) : 0;
            const newBalance = currentBalance + Number(amount);
            
            if (newBalance > 5000) {
                throw new Error(`Limit Exceeded: BASIC accounts have a maximum wallet balance of ₱5,000. Current: ₱${currentBalance}. Requested: ₱${amount}.`);
            }
        }

        // 2. Wrap operations in a transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Create pending transaction
            const transaction = await tx.transaction.create({
                data: {
                    amount,
                    type: 'CASH_IN',
                    status: 'PENDING',
                    senderId: null, // External source
                    receiverId: userId,
                    description: description || `Cash In via ${provider || 'Partner'}`,
                    referenceId,
                    fee: 0.0
                }
            });

            // Upsert wallet (create if doesn't exist, though it should)
            const wallet = await tx.wallet.upsert({
                where: { userId },
                create: { userId, balance: amount },
                update: { balance: { increment: amount } }
            });

            // Accounting Logic
            const cashAtBankAcc = await tx.chartOfAccount.findUnique({ where: { code: '1000' } });
            const walletAcc = await tx.chartOfAccount.findUnique({ where: { code: '1010' } });

            if (cashAtBankAcc && walletAcc) {
                await tx.ledgerEntry.create({
                    data: {
                        accountId: cashAtBankAcc.id,
                        transactionId: transaction.id,
                        referenceId,
                        description: `Cash In: ${description || 'Deposit'}`,
                        debit: amount,
                        credit: 0
                    }
                });
                await tx.ledgerEntry.create({
                    data: {
                        accountId: walletAcc.id,
                        transactionId: transaction.id,
                        referenceId,
                        description: `Cash In: ${description || 'Deposit'}`,
                        debit: 0,
                        credit: amount
                    }
                });
            }

            // Mark completed
            const completedTransaction = await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                },
                include: {
                    receiver: { select: { email: true } }
                }
            });

            // Audit Log
            await tx.auditLog.create({
                data: {
                    userId: userId,
                    action: 'CASH_IN_COMPLETED',
                    entity: 'Financial',
                    entityId: completedTransaction.id,
                    newValue: {
                        amount: completedTransaction.amount,
                        referenceId: completedTransaction.referenceId,
                        type: completedTransaction.type,
                        provider: provider
                    },
                    metadata: {
                        compliance: 'BSP Circular No. 808',
                        standard: 'Financial Transaction Audit',
                        timestamp: new Date().toISOString()
                    }
                }
            });

            return completedTransaction;
        });

        // Try to trigger Pusher update if configured
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/system/realtime`, {
                event: 'transaction_update',
                channel: `private-user-${userId}`,
                data: {
                    message: `Successfully cashed in PHP ${amount}`,
                    transaction: result
                }
            }).catch(() => null); // Fail silently for pusher
        } catch (e) { }

        return NextResponse.json({ message: 'Cash in successful', transaction: result });

    } catch (error: any) {
        console.error('[Cash In API] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
