/**
 * Order Auto-Completion Utility
 * Handles automatic order completion after delivery confirmation period
 * 
 * Dynamic buyer confirmation period (configurable via Admin Settings)
 * After specified days from delivery, orders are automatically marked as COMPLETED
 */

import { releaseFunds, creditPendingBalance } from './escrow';
import { sendEmail, sendOrderStatusEmail } from './email';
import { prisma } from './prisma';

/**
 * Schedule auto-completion for an order after specified days
 * Called when order status changes to DELIVERED
 * 
 * @param {string} orderId - Order ID
 * @param {number} days - Number of days to wait (optional, fetches from settings if not provided)
 * @returns {Promise<Date>} - The scheduled auto-completion date
 */
export async function scheduleAutoComplete(orderId, days) {
    try {
        let thresholdDays = days;

        // If days not provided, fetch from settings
        if (thresholdDays === undefined || thresholdDays === null) {
            const { getSystemSettings } = await import('./services/systemSettingsService');
            const settings = await getSystemSettings();
            thresholdDays = settings?.protectionWindowDays || 7;
        }

        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + thresholdDays);

        // Update order with auto-completion date
        await prisma.order.update({
            where: { id: orderId },
            data: {
                autoCompleteAt: completionDate
            }
        });

        console.log(`[Auto-Complete] Order ${orderId} scheduled for auto-completion on ${completionDate.toISOString()}`);

        return completionDate;
    } catch (error) {
        console.error(`[Auto-Complete] Failed to schedule auto-completion for order ${orderId}:`, error);
        throw error;
    }
}

export async function processAutoCompletions(days) {
    const now = new Date();

    try {
        let thresholdDays = days;

        // If days not provided (from cron), fetch from settings
        if (thresholdDays === undefined) {
            const { getSystemSettings } = await import('./services/systemSettingsService');
            const settings = await getSystemSettings();
            thresholdDays = settings?.protectionWindowDays || 7;
        }

        console.log(`[Auto-Complete] Starting auto-completion process at ${now.toISOString()} with threshold of ${thresholdDays} days`);
        // Find orders that are DELIVERED and past auto-complete date
        // OR delivered more than X days ago if autoCompleteAt is missing
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - thresholdDays);

        const ordersToComplete = await prisma.order.findMany({
            where: {
                status: 'DELIVERED',
                OR: [
                    { autoCompleteAt: { lte: now } },
                    { deliveredAt: { lte: pastDate } }
                ]
            },
            include: {
                user: true,
                store: {
                    include: {
                        wallet: true,
                        user: true
                    }
                },
                orderItems: {
                    include: {
                        product: true
                    }
                }
            }
        });

        console.log(`[Auto-Complete] Found ${ordersToComplete.length} orders ready for auto-completion`);

        const results = {
            total: ordersToComplete.length,
            completed: 0,
            failed: 0,
            errors: []
        };

        for (const order of ordersToComplete) {
            try {
                console.log(`[Auto-Complete] Processing order ${order.id}`);

                // 1. Release Funds (if paid)
                if (order.isPaid) {
                    const platformFee = order.total * 0.05;
                    const netAmount = order.total - platformFee;

                    // SELF-HEALING: Check if this order was ever credited to escrow
                    // If not (legacy order or migration), credit it now before releasing
                    const existingTransaction = await prisma.transaction.findFirst({
                        where: {
                            walletId: order.store?.wallet?.id,
                            description: {
                                contains: `order ${order.id}`
                            }
                        }
                    });

                    if (!existingTransaction) {
                        console.log(`[Auto-Complete] ⚠️ Order ${order.id} has no escrow record. Backfilling credit...`);
                        await creditPendingBalance({
                            orderId: order.id,
                            amount: order.total,
                            gateway: order.paymentMethod || 'SYSTEM_MIGRATION'
                        });

                        // Small delay to ensure DB consistency if needed, though await should handle it
                    }

                    await releaseFunds({
                        orderId: order.id,
                        amount: netAmount
                    });

                    // Send funds released notification to seller
                    if (order.store?.user?.email) {
                        try {
                            await sendEmail({
                                to: order.store.user.email,
                                subject: `Funds Released - Order #${order.id.substring(0, 8)}`,
                                html: `
                                    <h2>Funds Released from Escrow</h2>
                                    <p>Good news! Your funds have been released from escrow.</p>
                                    
                                    <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                        <p><strong>Order ID:</strong> ${order.id}</p>
                                        <p><strong>Amount Released:</strong> ₱${netAmount.toFixed(2)}</p>
                                        <p><strong>Platform Fee (5%):</strong> ₱${platformFee.toFixed(2)}</p>
                                        <p><strong>Status:</strong> Available for Withdrawal</p>
                                    </div>
                                    
                                    <p>The funds are now available in your wallet and ready for withdrawal.</p>
                                    <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/store/wallet" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Wallet</a></p>
                                `
                            });
                            console.log(`[Auto-Complete] Fund release email sent to seller for order ${order.id}`);
                        } catch (emailError) {
                            console.error(`[Auto-Complete] Failed to send fund release email for order ${order.id}:`, emailError);
                        }
                    }
                }

                // 2. Update order to COMPLETED
                const updatedOrder = await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: 'COMPLETED',
                        completedAt: now
                    },
                    include: {
                        user: true,
                        store: true
                    }
                });

                // 3. Send completion notification email to customer
                try {
                    await sendOrderStatusEmail(
                        updatedOrder.user.email,
                        updatedOrder,
                        updatedOrder.user,
                        updatedOrder.store,
                        'COMPLETED'
                    );
                    console.log(`[Auto-Complete] Completion email sent for order ${order.id}`);
                } catch (emailError) {
                    console.error(`[Auto-Complete] Failed to send completion email for order ${order.id}:`, emailError);
                }

                results.completed++;
                console.log(`[Auto-Complete] ✅ Order ${order.id} auto-completed successfully`);

            } catch (error) {
                results.failed++;
                results.errors.push({
                    orderId: order.id,
                    error: error.message
                });
                console.error(`[Auto-Complete] ❌ Failed to auto-complete order ${order.id}:`, error);
            }
        }

        console.log(`[Auto-Complete] Process completed. Results:`, results);

        return results;

    } catch (error) {
        console.error('[Auto-Complete] Fatal error in auto-completion process:', error);
        throw error;
    }
}

/**
 * Get orders pending auto-completion
 * Useful for monitoring and debugging
 * 
 * @param {number} limit - Maximum number of orders to return
 * @returns {Promise<Array>} - List of orders pending auto-completion
 */
export async function getPendingAutoCompletions(limit = 100) {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: 'DELIVERED',
                autoCompleteAt: {
                    not: null
                }
            },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true
                    }
                },
                store: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                autoCompleteAt: 'asc'
            },
            take: limit
        });

        return orders.map(order => ({
            orderId: order.id,
            customerEmail: order.user.email,
            storeName: order.store.name,
            deliveredAt: order.deliveredAt,
            autoCompleteAt: order.autoCompleteAt,
            daysUntilCompletion: Math.ceil((new Date(order.autoCompleteAt) - new Date()) / (1000 * 60 * 60 * 24))
        }));

    } catch (error) {
        console.error('[Auto-Complete] Failed to get pending auto-completions:', error);
        throw error;
    }
}

/**
 * Cancel auto-completion for an order
 * Used when customer manually completes or requests return
 * 
 * @param {string} orderId - Order ID
 * @returns {Promise<void>}
 */
export async function cancelAutoComplete(orderId) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                autoCompleteAt: null
            }
        });

        console.log(`[Auto-Complete] Auto-completion cancelled for order ${orderId}`);
    } catch (error) {
        console.error(`[Auto-Complete] Failed to cancel auto-completion for order ${orderId}:`, error);
        throw error;
    }
}
