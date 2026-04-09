import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, qrData } = body;
        
        if (!userId || !qrData || !qrData.paymentIntentId || !qrData.amount) {
            return NextResponse.json({ error: "Invalid QR data: Missing required fields" }, { status: 400 });
        }

        const amountToPay = parseFloat(qrData.amount);
        if (isNaN(amountToPay) || amountToPay <= 0) {
            return NextResponse.json({ error: "Invalid amount in QR data" }, { status: 400 });
        }

        // 1. Find the transaction
        let transaction = await prisma.transaction.findUnique({
            where: { id: qrData.paymentIntentId }
        });

        if (!transaction) {
            transaction = await prisma.transaction.findUnique({
                where: { referenceId: qrData.paymentIntentId }
            });
        }

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        if (Math.abs(parseFloat(transaction.amount.toString()) - amountToPay) > 0.01) {
            return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
        }

        if (transaction.status !== 'PENDING') {
            return NextResponse.json({ error: `Transaction already ${transaction.status}` }, { status: 400 });
        }

        // 2. Check Wallet
        let wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) {
            return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
        }

        if (parseFloat(wallet.balance.toString()) < amountToPay) {
            return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
        }

        const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : {};
        const storeName = qrData.storeName || qrData.merchant || metadata.storeName || metadata.merchantName || 'Unknown Merchant';
        const orderId = qrData.orderId || metadata.orderId || 'N/A';

        // 3. Process Transaction Atoms
        const result = await prisma.$transaction(async (tx) => {
            // Deduct
            const updatedWallet = await tx.wallet.update({
                where: { userId },
                data: { balance: { decrement: amountToPay } }
            });

            // Mark complete
            const completedTransaction = await tx.transaction.update({
                where: { id: transaction.id },
                data: { 
                    senderId: userId,
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    storeId: qrData.storeId || null,
                    storeName: qrData.storeName || null
                }
            });

            // Audit
            await tx.auditLog.create({
                data: {
                    userId: userId,
                    action: 'QR_PAYMENT_COMPLETED',
                    entity: 'Financial',
                    entityId: transaction.id,
                    newValue: {
                        amount: completedTransaction.amount,
                        referenceId: completedTransaction.referenceId,
                        type: completedTransaction.type,
                        merchant: storeName,
                        newBalance: updatedWallet.balance
                    },
                    metadata: {
                        compliance: 'BSP Circular No. 808',
                        standard: 'Financial Transaction Audit',
                        timestamp: new Date().toISOString()
                    }
                }
            });

            return { updatedWallet, completedTransaction };
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Payment processed successfully',
            newBalance: Number(result.updatedWallet.balance),
            transaction: {
                id: result.completedTransaction.id,
                reference: result.completedTransaction.referenceId,
                orderId: orderId,
                amount: Number(result.completedTransaction.amount),
                storeName: storeName,
                date: new Date().toISOString(),
                status: 'COMPLETED'
            }
        });

    } catch (error: any) {
        console.error('[QR Processing API] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
