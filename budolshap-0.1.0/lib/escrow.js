/**
 * Escrow Service - Gateway-Agnostic Fund Management
 * 
 * This module handles the virtual escrow system for the marketplace.
 * It provides functions to credit pending balances, release funds, and manage
 * seller payouts in a way that's completely independent of payment gateways.
 * 
 * @module lib/escrow
 */

import { prisma } from './prisma'
import { createLedgerEntry, buildOrderPaymentEntries } from './accounting'

/**
 * Credit seller's pending balance when payment is received
 * 
 * This function is called by payment gateway webhooks (PayMongo, Xendit, etc.)
 * when a payment is successfully completed. It:
 * 1. Calculates platform fee (5%)
 * 2. Credits net earnings to seller's pendingBalance
 * 3. Creates transaction record for audit trail
 * 
 * @param {Object} params - Payment details
 * @param {string} params.orderId - Order ID
 * @param {number} params.amount - Payment amount received
 * @param {string} params.gateway - Payment gateway name (PAYMONGO, XENDIT, etc.)
 * @returns {Promise<Object>} Transaction record
 * 
 * @example
 * await creditPendingBalance({
 *   orderId: 'order_123',
 *   amount: 1000,
 *   gateway: 'PAYMONGO'
 * })
 */
export async function creditPendingBalance({ orderId, amount, gateway }) {
    try {
        // Fetch order with store information
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                store: {
                    include: {
                        wallet: true
                    }
                }
            }
        })

        if (!order) {
            throw new Error(`Order not found: ${orderId}`)
        }

        if (!order.store) {
            throw new Error(`Store not found for order: ${orderId}`)
        }

        // Calculate platform fee (5%) and net earnings
        const platformFee = amount * 0.05
        const netEarnings = amount - platformFee

        // Create or get wallet for the store
        let wallet = order.store.wallet

        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: {
                    storeId: order.store.id,
                    balance: 0,
                    pendingBalance: 0
                }
            })
        }

        // Update wallet and mark order as PROCESSING (which includes PAID status) in a single transaction
        const [updatedWallet] = await prisma.$transaction([
            prisma.wallet.update({
                where: { id: wallet.id },
                data: {
                    pendingBalance: {
                        increment: netEarnings
                    }
                }
            }),
            prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'PROCESSING',
                    isPaid: true
                }
            })
        ])

        // Create transaction record for audit trail
        const transaction = await prisma.transaction.create({
            data: {
                walletId: wallet.id,
                amount: netEarnings,
                type: 'CREDIT',
                description: `Escrow hold for order ${orderId} via ${gateway} (Platform fee: ₱${platformFee.toFixed(2)})`
            }
        })

        console.log(`✅ Escrow credited: ₱${netEarnings.toFixed(2)} to wallet ${wallet.id} for order ${orderId}`)

        // --- HYBRID ACCOUNTING SYNC ---
        // Record the transaction in the Global Observer Ledger
        try {
            await createLedgerEntry({
                transactionId: transaction.id,
                referenceId: orderId,
                entries: buildOrderPaymentEntries({
                    orderId,
                    total: amount,
                    platformFee,
                    netEarnings
                })
            });
        } catch (accError) {
            console.warn('[Accounting] Non-blocking sync failure:', accError.message);
            // We don't fail the escrow credit if accounting sync fails
        }

        return {
            success: true,
            transaction,
            wallet: updatedWallet,
            details: {
                orderId,
                gateway,
                totalAmount: amount,
                platformFee,
                netEarnings,
                newPendingBalance: updatedWallet.pendingBalance
            }
        }

    } catch (error) {
        console.error('❌ Error crediting pending balance:', error)
        throw error
    }
}

/**
 * Release funds from pending balance to available balance for a store
 * Called when order is completed (after delivery protection window or manual completion).
 * 
 * @param {Object} params - Release details
 * @param {string} params.orderId - Order ID
 * @param {number} params.amount - Amount to release
 * @returns {Promise<Object>} Transaction record
 * 
 * @example
 * await releaseFunds({
 *   orderId: 'order_123',
 *   amount: 950
 * })
 */
export async function releaseFunds({ orderId, amount }) {
    try {
        // Fetch order with store and wallet
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                store: {
                    include: {
                        wallet: true
                    }
                }
            }
        })

        if (!order) {
            throw new Error(`Order not found: ${orderId}`)
        }

        // Ensure wallet exists before releasing funds
        let wallet = order.store?.wallet
        if (!wallet) {
            // If it's unpaid, there's nothing to release
            if (!order.isPaid) {
                console.log(`⚠️ Order ${orderId} is unpaid. Skipping fund release.`)
                return { success: true, message: 'Skipped: Order unpaid' }
            }

            // If paid but wallet missing, create it (legacy/recovery)
            wallet = await prisma.wallet.create({
                data: {
                    storeId: order.storeId,
                    balance: 0,
                    pendingBalance: 0
                }
            })
        }

        // Use the wallet we found or created above

        // Verify sufficient pending balance
        if (wallet.pendingBalance < amount) {
            throw new Error(
                `Insufficient pending balance. Required: ₱${amount}, Available: ₱${wallet.pendingBalance}`
            )
        }

        // Transfer from pending to available
        const updatedWallet = await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                pendingBalance: {
                    decrement: amount
                },
                balance: {
                    increment: amount
                }
            }
        })

        // Create transaction record
        const transaction = await prisma.transaction.create({
            data: {
                walletId: wallet.id,
                amount: amount,
                type: 'CREDIT',
                description: `Funds released for completed order ${orderId}`
            }
        })

        console.log(`✅ Funds released: ₱${amount.toFixed(2)} from pending to available for order ${orderId}`)

        return {
            success: true,
            transaction,
            wallet: updatedWallet,
            details: {
                orderId,
                amountReleased: amount,
                newPendingBalance: updatedWallet.pendingBalance,
                newAvailableBalance: updatedWallet.balance
            }
        }

    } catch (error) {
        console.error('❌ Error releasing funds:', error)
        throw error
    }
}

/**
 * Get escrow summary for a store
 * 
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} Escrow summary
 */
export async function getEscrowSummary(storeId) {
    try {
        const wallet = await prisma.wallet.findUnique({
            where: { storeId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        })

        if (!wallet) {
            return {
                pendingBalance: 0,
                availableBalance: 0,
                totalEarnings: 0,
                recentTransactions: []
            }
        }

        return {
            pendingBalance: wallet.pendingBalance,
            availableBalance: wallet.balance,
            totalEarnings: wallet.pendingBalance + wallet.balance,
            recentTransactions: wallet.transactions
        }

    } catch (error) {
        console.error('❌ Error getting escrow summary:', error)
        throw error
    }
}

/**
 * Lock funds in pending balance due to a return/refund request
 * 
 * @param {Object} params - Lock details
 * @param {string} params.orderId - Order ID
 * @param {number} params.amount - Amount to lock
 * @returns {Promise<Object>} Updated wallet
 */
export async function lockFunds({ orderId, amount }) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { store: { include: { wallet: true } } }
        });

        if (!order) throw new Error(`Order not found: ${orderId}`);

        // If order hasn't been paid yet, there are no funds in escrow to lock.
        // This is normal for unpaid COD orders or pending payments.
        if (!order.isPaid) {
            console.log(`⚠️ Skipping fund lock for unpaid order ${orderId}`);
            return null;
        }

        // Ensure wallet exists
        let wallet = order.store?.wallet;
        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: {
                    storeId: order.storeId,
                    balance: 0,
                    pendingBalance: 0,
                    lockedBalance: 0
                }
            });
        }

        // Move from pending to locked
        const updatedWallet = await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                pendingBalance: { decrement: amount },
                lockedBalance: { increment: amount }
            }
        });

        await prisma.transaction.create({
            data: {
                walletId: wallet.id,
                amount: amount,
                type: 'DEBIT',
                description: `Funds locked for Return Request (Order: ${orderId})`
            }
        });

        return updatedWallet;
    } catch (error) {
        console.error('❌ Error locking funds:', error);
        throw error;
    }
}

/**
 * Refund funds to buyer from the locked balance
 */
export async function refundFromLocked({ orderId, amount }) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { store: { include: { wallet: true } } }
        });

        if (!order) throw new Error(`Order not found: ${orderId}`);

        // If order wasn't paid, there's nothing to refund from escrow
        if (!order.isPaid) {
            console.log(`⚠️ Skipping refund from locked for unpaid order ${orderId}`);
            return null;
        }

        // Ensure wallet exists
        let wallet = order.store?.wallet;
        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: { storeId: order.storeId, balance: 0, pendingBalance: 0, lockedBalance: 0 }
            });
        }

        // Finalize the lock - remove from lockedBalance entirely
        const updatedWallet = await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                lockedBalance: { decrement: amount }
            }
        });

        await prisma.transaction.create({
            data: {
                walletId: wallet.id,
                amount: amount,
                type: 'DEBIT',
                description: `Refund processed to Buyer (Order: ${orderId})`
            }
        });

        return updatedWallet;
    } catch (error) {
        console.error('❌ Error refunding from locked:', error);
        throw error;
    }
}

/**
 * Release funds from locked back to pending (if return is rejected/cancelled)
 */
export async function releaseFromLocked({ orderId, amount }) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { store: { include: { wallet: true } } }
        });

        if (!order) throw new Error(`Order not found: ${orderId}`);

        // If order wasn't paid, nothing to release
        if (!order.isPaid) {
            console.log(`⚠️ Skipping release from locked for unpaid order ${orderId}`);
            return null;
        }

        // Ensure wallet exists
        let wallet = order.store?.wallet;
        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: { storeId: order.storeId, balance: 0, pendingBalance: 0, lockedBalance: 0 }
            });
        }

        const updatedWallet = await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                lockedBalance: { decrement: amount },
                pendingBalance: { increment: amount }
            }
        });

        await prisma.transaction.create({
            data: {
                walletId: wallet.id,
                amount: amount,
                type: 'CREDIT',
                description: `Funds unlocked back to Pending (Return Rejected/Cancelled for Order: ${orderId})`
            }
        });

        return updatedWallet;
    } catch (error) {
        console.error('❌ Error releasing from locked:', error);
        throw error;
    }
}

/**
 * Calculate platform fee
 * 
 * @param {number} amount - Order amount
 * @returns {Object} Fee breakdown
 */
export function calculatePlatformFee(amount) {
    const feePercentage = 0.05 // 5%
    const platformFee = amount * feePercentage
    const netEarnings = amount - platformFee

    return {
        totalAmount: amount,
        platformFee,
        feePercentage: feePercentage * 100,
        netEarnings
    }
}
