import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { triggerRealtimeEvent } from "@/lib/realtime-server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { senderId, receiverId, recipient, amount, description } = body;
        
        if (!senderId || (!receiverId && !recipient) || !amount) {
            return NextResponse.json({ error: "senderId, receiverId/recipient, and amount are required" }, { status: 400 });
        }

        let resolvedReceiverId = receiverId;

        // 0. Resolve receiver if recipient (email/phone) is provided instead of ID
        if (!resolvedReceiverId && recipient) {
            const recipientUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: recipient },
                        { phoneNumber: recipient }
                    ]
                }
            });

            if (!recipientUser) {
                return NextResponse.json({ error: `Recipient not found: ${recipient}` }, { status: 404 });
            }
            resolvedReceiverId = recipientUser.id;
        }

        if (senderId === resolvedReceiverId) {
            return NextResponse.json({ error: "Cannot send money to yourself" }, { status: 400 });
        }

        const referenceId = `BP-${uuidv4().slice(0, 8).toUpperCase()}`;

        // Validate sender and KYC
        const sender = await prisma.user.findUnique({
            where: { id: senderId },
            include: { wallet: true }
        });

        if (!sender) throw new Error("Sender not found");

        if (sender.kycTier === 'BASIC') {
            throw new Error("Verification required: BASIC accounts cannot send money P2P. Please upgrade to FULLY VERIFIED.");
        }

        const senderBalance = sender.wallet ? Number(sender.wallet.balance) : 0;
        if (senderBalance < Number(amount)) {
            throw new Error("Insufficient Balance");
        }

        // Validate receiver
        const receiver = await prisma.user.findUnique({
            where: { id: resolvedReceiverId }
        });

        if (!receiver) throw new Error("Receiver not found");

        const result = await prisma.$transaction(async (tx) => {
            // Deduct sender
            await tx.wallet.update({
                where: { userId: senderId },
                data: { balance: { decrement: amount } }
            });

            // Credit receiver
            await tx.wallet.upsert({
                where: { userId: resolvedReceiverId },
                create: { userId: resolvedReceiverId, balance: amount },
                update: { balance: { increment: amount } }
            });

            // Create Transaction
            const transaction = await tx.transaction.create({
                data: {
                    amount,
                    type: 'P2P_TRANSFER',
                    status: 'COMPLETED',
                    senderId,
                    receiverId: resolvedReceiverId,
                    description: description || `P2P Transfer to ${receiver.firstName || receiver.email}`,
                    referenceId,
                    fee: 0.0,
                    completedAt: new Date()
                },
                include: {
                    sender: { select: { email: true, firstName: true, lastName: true } },
                    receiver: { select: { email: true, firstName: true, lastName: true } }
                }
            });

            // Ledger Entries
            const walletAccount = await tx.chartOfAccount.findUnique({ where: { code: '1010' } });
            if (walletAccount) {
                await tx.ledgerEntry.create({
                    data: {
                        accountId: walletAccount.id,
                        transactionId: transaction.id,
                        referenceId,
                        description: `P2P Transfer Out: ${description || 'Transfer'}`,
                        debit: amount,
                        credit: 0
                    }
                });
                await tx.ledgerEntry.create({
                    data: {
                        accountId: walletAccount.id,
                        transactionId: transaction.id,
                        referenceId,
                        description: `P2P Transfer In: ${description || 'Transfer'}`,
                        debit: 0,
                        credit: amount
                    }
                });
            }

            // Compliance Audit Log
            const audit = await tx.auditLog.create({
                data: {
                    userId: senderId,
                    action: 'P2P_TRANSFER_COMPLETED',
                    entity: 'Financial',
                    entityId: transaction.id,
                    newValue: {
                        amount: transaction.amount,
                        referenceId: transaction.referenceId,
                        type: transaction.type,
                        receiverId: transaction.receiverId
                    },
                    metadata: {
                        compliance: 'BSP Circular No. 808',
                        standard: 'Financial Transaction Audit',
                        timestamp: new Date().toISOString()
                    }
                }
            });

            return { transaction, audit };
        });

        const responseData = {
            ...result.transaction,
            amount: Number(result.transaction.amount),
            fee: Number(result.transaction.fee)
        };

        // v43.3: Automatic real-time sync is now handled by the Prisma Extension in @/lib/prisma
        // No manual triggers needed here.
        
        return NextResponse.json({ message: 'Transfer successful', transaction: responseData });

    } catch (error: any) {
        console.error('[P2P Transfer API] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
