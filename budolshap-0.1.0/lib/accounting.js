/**
 * budolAccounting Sync Utility
 * 
 * Provides functions to synchronize marketplace transactions with the 
 * centralized budolAccounting ledger (Global Observer).
 */

export async function createLedgerEntry({ appId, transactionId, referenceId, entries }) {
    const url = process.env.BUDOLACCOUNTING_URL || 'http://localhost:8005';
    
    try {
        console.log(`[Accounting] Syncing entry for ${transactionId} to ${url}...`);
        
        const response = await fetch(`${url}/ledger/entry`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                appId: appId || 'budolShap',
                transactionId,
                referenceId,
                entries
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Accounting] Sync Error:', data);
            return { success: false, error: data.error };
        }

        console.log('[Accounting] ✅ Sync Successful:', data.message);
        return { success: true, data };
    } catch (error) {
        console.error('[Accounting] Network Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Standard Entry Builder for Order Payments
 */
export function buildOrderPaymentEntries({ orderId, total, platformFee, netEarnings }) {
    return [
        {
            accountCode: '1000', // Cash/Asset
            debit: total,
            credit: 0,
            description: `Payment received for order ${orderId}`
        },
        {
            accountCode: '4000', // Platform Revenue
            debit: 0,
            credit: platformFee,
            description: `Commission for order ${orderId}`
        },
        {
            accountCode: '2000', // Liability (to Seller)
            debit: 0,
            credit: netEarnings,
            description: `Net earnings for seller from order ${orderId}`
        }
    ];
}
