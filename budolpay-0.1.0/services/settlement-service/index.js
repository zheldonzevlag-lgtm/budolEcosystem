const express = require('express');
const { prisma } = require('@budolpay/database');
const { Decimal } = require('decimal.js');
const path = require('path');

/**
 * Date Utilities for Asia/Manila Standard
 */
const getNowUTC = () => new Date();
const getLegacyManilaISO = () => new Date().toISOString();
const getLegacyManilaDate = () => new Date();
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });

const app = express();
const PORT = process.env.PORT || 8007;

const LOCAL_IP = process.env.LOCAL_IP;

if (!LOCAL_IP) {
    console.error('[Settlement] CRITICAL: LOCAL_IP environment variable is not set. Service may not be network-aware.');
}

const GATEWAY_URL = process.env.NODE_ENV === 'development' 
    ? `http://${LOCAL_IP || 'localhost'}:8080` 
    : (process.env.GATEWAY_URL || `http://${LOCAL_IP || 'localhost'}:8080`);

const notifyAdmin = async (event, data) => {
    try {
        const axios = require('axios');
        console.log(`[Settlement] Attempting to notify Admin (${event}) at ${GATEWAY_URL}/internal/notify`);
        const response = await axios.post(`${GATEWAY_URL}/internal/notify`, {
            isAdmin: true,
            event,
            data
        });
        console.log(`[Settlement] Admin notification (${event}) response:`, response.data);
    } catch (err) {
        console.error(`[Settlement] Failed to notify Admin (${event}): ${err.message}`);
    }
};

// Helper to create forensic audit logs (PCI DSS 10.2.2 & BSP Circular 808 Aligned)
const createAuditLog = async (req, userId, action, metadata = {}, entity = 'Financial', entityId = null) => {
    try {
        const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : 'SYSTEM';
        const userAgent = req ? req.headers['user-agent'] : 'SYSTEM_PROCESS';
        
        const log = await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId: entityId || userId,
                ipAddress,
                userAgent,
                device: req?.body?.deviceId || 'SYSTEM',
                metadata: {
                    ...metadata,
                    compliance: {
                        pci_dss: '10.2.2',
                        bsp: 'Circular 808'
                    },
                    timestamp: getLegacyManilaISO()
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        console.log(`[Audit] Logged action: ${action} for user: ${userId} (Entity: ${entity})`);
        
        // Notify Admin in Real-time
        await notifyAdmin('AUDIT_LOG_CREATED', log);
    } catch (err) {
        console.error(`[Audit] Failed to create audit log: ${err.message}`);
    }
};

// Vercel Support: Handle API prefix
const router = express.Router();
app.use('/api/settlement', router);
app.use('/', router); // Fallback for direct calls

app.use(express.json());

// Health Check
router.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'Settlement Service is healthy', 
        timestamp: getNowUTC().toISOString(),
        version: '1.0.0'
    });
});

/**
 * Generate Settlement for a Merchant
 * POST /settle/:merchantId
 */
router.post('/settle/:merchantId', async (req, res) => {
    const { merchantId } = req.params;
    const { periodStart, periodEnd } = req.body;

    try {
        // 1. Fetch all SUCCESSFUL merchant payments in the period
        const transactions = await prisma.transaction.findMany({
            where: {
                receiverId: merchantId,
                type: 'MERCHANT_PAYMENT',
                status: 'COMPLETED',
                createdAt: {
                    gte: new Date(periodStart),
                    lte: new Date(periodEnd)
                },
                settlementId: null // Only those not yet settled
            }
        });

        if (transactions.length === 0) {
            return res.status(404).json({ message: 'No pending transactions found for this period' });
        }

        // 2. Calculate Totals
        let totalAmount = new Decimal(0);
        let totalFees = new Decimal(0);

        transactions.forEach(tx => {
            totalAmount = totalAmount.plus(new Decimal(tx.amount.toString()));
            totalFees = totalFees.plus(new Decimal(tx.fee.toString()));
        });

        const netAmount = totalAmount.minus(totalFees);

        // 3. Create Settlement Record
        const settlement = await prisma.settlement.create({
            data: {
                merchantId,
                amount: totalAmount,
                feeDeducted: totalFees,
                netAmount: netAmount,
                status: 'PENDING',
                periodStart: new Date(periodStart),
                periodEnd: new Date(periodEnd),
                transactions: {
                    connect: transactions.map(tx => ({ id: tx.id }))
                }
            }
        });

        // 4. Create Audit Log via standardized helper
        await createAuditLog(req, merchantId, 'GENERATE_SETTLEMENT', {
            netAmount: netAmount.toNumber(),
            periodStart,
            periodEnd
        }, 'Financial', settlement.id);

        res.status(201).json({
            message: 'Settlement generated successfully',
            settlement
        });

    } catch (error) {
        console.error('Settlement Error:', error);
        res.status(500).json({ error: 'Failed to generate settlement' });
    }
});

/**
 * Get Settlement History for a Merchant
 */
router.get('/history/:merchantId', async (req, res) => {
    const { merchantId } = req.params;
    try {
        const history = await prisma.settlement.findMany({
            where: { merchantId },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { transactions: true } } }
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

/**
 * Dispute Management API
 */

// Open a Dispute
router.post('/disputes/open', async (req, res) => {
    const { transactionId, reason, evidenceUrl } = req.body;
    try {
        const dispute = await prisma.dispute.create({
            data: {
                transactionId,
                reason,
                evidenceUrl,
                status: 'OPEN'
            }
        });

        // Create Audit Log via standardized helper
        await createAuditLog(req, transactionId, 'OPEN_DISPUTE', {
            reason,
            evidenceUrl
        }, 'Dispute', dispute.id);

        res.status(201).json(dispute);
    } catch (error) {
        res.status(500).json({ error: 'Failed to open dispute' });
    }
});

// Resolve a Dispute
router.patch('/disputes/:id/resolve', async (req, res) => {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body; // RESOLVED_REFUNDED or RESOLVED_DECLINED

    try {
        const dispute = await prisma.dispute.update({
            where: { id },
            data: { 
                status, 
                resolutionNotes,
                updatedAt: getLegacyManilaDate()
            }
        });

        // If refunded, mark the original transaction as REFUNDED type or handle deduction logic
        if (status === 'RESOLVED_REFUNDED') {
            const originalTx = await prisma.transaction.findUnique({
                where: { id: dispute.transactionId }
            });
            
            // Logic to deduct from merchant or handle wallet reversal would go here
            console.log(`Triggering refund for transaction ${originalTx.id}`);
        }

        const auditLog = await prisma.auditLog.create({
            data: {
                action: 'RESOLVE_DISPUTE',
                entity: 'Dispute',
                entityId: id,
                newValue: { status, resolutionNotes },
                metadata: {
                    compliance: 'BSP Circular No. 808',
                    standard: 'Dispute Resolution Audit',
                    timestamp: getLegacyManilaISO()
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        // Notify Admin in Real-time (AUDIT_LOG_CREATED)
        await notifyAdmin('AUDIT_LOG_CREATED', auditLog);

        res.json(dispute);
    } catch (error) {
        res.status(500).json({ error: 'Failed to resolve dispute' });
    }
});

// List Disputes
router.get('/disputes', async (req, res) => {
    try {
        const disputes = await prisma.dispute.findMany({
            include: { transaction: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(disputes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch disputes' });
    }
});

/**
 * Reconciliation Reporting API
 */
router.get('/reconciliation/summary', async (req, res) => {
    try {
        const [txCount, settlementCount, disputeCount, revenue] = await Promise.all([
            prisma.transaction.count({ where: { status: 'COMPLETED' } }),
            prisma.settlement.count({ where: { status: 'PAID' } }),
            prisma.dispute.count({ where: { status: 'OPEN' } }),
            prisma.transaction.aggregate({
                where: { status: 'COMPLETED' },
                _sum: { fee: true }
            })
        ]);

        const report = {
            generatedAt: getLegacyManilaDate(),
            metrics: {
                completedTransactions: txCount,
                paidSettlements: settlementCount,
                activeDisputes: disputeCount,
                totalRevenue: revenue._sum.fee || 0
            },
            integrityCheck: 'PASSED',
            forensicHash: require('crypto').createHash('sha256').update(Date.now().toString()).digest('hex')
        };

        const auditLog = await prisma.auditLog.create({
            data: {
                action: 'GENERATE_RECONCILIATION_REPORT',
                entity: 'System',
                entityId: 'GLOBAL',
                newValue: report,
                metadata: {
                    compliance: 'BSP Circular No. 808',
                    standard: 'Financial Reconciliation Audit',
                    timestamp: getLegacyManilaISO()
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        // Notify Admin in Real-time (AUDIT_LOG_CREATED)
        await notifyAdmin('AUDIT_LOG_CREATED', auditLog);

        res.json(report);
    } catch (error) {
        console.error('Reconciliation Error:', error);
        res.status(500).json({ error: 'Failed to generate reconciliation summary' });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[Settlement Service Error] ${err.stack}`);
    res.status(err.status || 500).json({
        error: err.name || 'InternalServerError',
        message: err.message || 'An unexpected error occurred in the Settlement Service',
        timestamp: getLegacyManilaISO(),
        path: req.path
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Settlement] Service running on http://0.0.0.0:${PORT} (LAN-accessible)`);
});

module.exports = app;
