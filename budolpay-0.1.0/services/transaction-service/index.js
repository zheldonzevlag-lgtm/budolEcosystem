const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { prisma } = require('@budolpay/database');
const { verifyToken, authorize } = require('@budolpay/database/auth');
const { PERMISSIONS } = require('@budolpay/database/rbac');
const { createAuditLog: createCentralizedAuditLog } = require('@budolpay/audit');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { calculateAnomalyScore } = require('./riskEngine');

/**
 * Date Utilities for Asia/Manila Standard
 */
const getNowUTC = () => new Date();
const getLegacyManilaISO = () => new Date().toISOString();
const getLegacyManilaDate = () => new Date();
const envPath = path.resolve(__dirname, '../../.env');
console.log(`[Transaction] Loading .env from: ${envPath}`);
require('dotenv').config({ path: envPath, override: true });

const app = express();
const PORT = process.env.PORT || 8003;

// 1. Middleware (MUST come before routes)
app.use(cors());
app.use(express.json());
// app.use(verifyToken);

// 2. Vercel Support: Handle API prefix
const router = express.Router();
app.use('/api/tx', router);
app.use('/', router);

const LOCAL_IP = process.env.LOCAL_IP;

if (!LOCAL_IP) {
    console.error('[Transaction] CRITICAL: LOCAL_IP environment variable is not set. Service may not be network-aware.');
}

const GATEWAY_URL = process.env.NODE_ENV === 'development' 
    ? `http://${LOCAL_IP || 'localhost'}:8080` 
    : (process.env.GATEWAY_URL || `http://${LOCAL_IP || 'localhost'}:8080`);
const WALLET_SERVICE_URL = process.env.NODE_ENV === 'development'
    ? `http://${LOCAL_IP || 'localhost'}:8002`
    : (process.env.WALLET_SERVICE_URL || `http://${LOCAL_IP || 'localhost'}:8002`);

// Helper to notify Gateway for real-time updates
const notifyUpdate = async (userId, event, data) => {
    try {
        await axios.post(`${GATEWAY_URL}/internal/notify`, {
            userId,
            event,
            data
        }, { timeout: 2000 });
        console.log(`[Transaction] Notification (${event}) sent to Gateway for user ${userId}`);
    } catch (err) {
        console.error(`[Transaction] Failed to notify Gateway (${event}): ${err.message}`);
    }
};

const notifyAdmin = async (event, data) => {
    try {
        await axios.post(`${GATEWAY_URL}/internal/notify`, {
            isAdmin: true,
            event,
            data
        }, { timeout: 2000 });
        console.log(`[Transaction] Admin notification (${event}) sent to Gateway`);
    } catch (err) {
        console.error(`[Transaction] Failed to notify Admin (${event}): ${err.message}`);
    }
};

// Helper to generate search variants for phone numbers (v2.4.2)
const getPhoneVariants = (input) => {
    if (!input || typeof input !== 'string') return [];
    
    // If it looks like an email, return as-is
    if (input.includes('@')) return [input];
    
    const clean = input.replace(/\D/g, '');
    
    // Standard PH Mobile (10 digits after prefix)
    if (clean.length === 10) { // e.g., 9484099400
        return [`0${clean}`, `+63${clean}`];
    }
    if (clean.length === 11 && clean.startsWith('0')) { // e.g., 09484099400
        return [clean, `+63${clean.slice(1)}`];
    }
    if (clean.length === 12 && clean.startsWith('63')) { // e.g., 639484099400
        return [`0${clean.slice(2)}`, `+${clean}`, `+${clean}`];
    }
    
    return [input, clean]; // Fallback
};

// Helper to create forensic audit logs using centralized audit helper
const createAuditLog = async (req, userId, action, metadata = {}, entity = 'Financial', entityId = null) => {
    try {
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        // Use centralized audit helper with proper metadata structure
        const auditLog = await createCentralizedAuditLog({
            action,
            entity,
            entityId: entityId || userId,
            userId,
            metadata: {
                ...metadata,
                ipAddress,
                userAgent,
                device: req.body.deviceId || 'UNKNOWN_DEVICE',
                compliance: {
                    pci_dss: '10.2.2',
                    bsp: 'Circular 808'
                }
            },
            ipAddress
        });

        if (auditLog) {
            console.log(`[Audit] Logged action: ${action} for user: ${userId} (Entity: ${entity})`);
        } else {
            console.error(`[Audit] Failed to create audit log for action: ${action}`);
        }
        
        return auditLog;
    } catch (err) {
        console.error(`[Audit] Failed to create audit log: ${err.message}`);
        return null;
    }
};

/**
 * Behavioral Scoring Engine (v2.4.0)
 * Integrates with riskEngine for dynamic baselining.
 */
/**
 * Monthly Cumulative Volume Tracker (v2.4.4)
 * WHY: This code exists to enforce BSP-compliant tiered limits for BASIC accounts, ensuring that non-verified users operate within established regulatory ceilings.
 * WHAT: Calculates the total volume of COMPLETED transactions for a user within the current calendar month by performing a Prisma aggregate sum.
 * TODO: Integrate with a caching layer (Redis) if transaction volume scales to avoid frequent DB aggregation.
 * @param {string} userId - The user ID to check.
 * @param {string} type - 'INBOUND' (Received) or 'OUTBOUND' (Sent).
 * @returns {Promise<number>} - The total amount as a float.
 */
const getMonthlyCumulativeVolume = async (userId, type) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const filter = type === 'OUTBOUND' 
            ? { senderId: userId } 
            : { receiverId: userId };

        const agg = await prisma.transaction.aggregate({
            where: {
                ...filter,
                status: 'COMPLETED',
                createdAt: { gte: startOfMonth }
            },
            _sum: { amount: true }
        });

        return parseFloat(agg._sum.amount || 0);
    } catch (err) {
        console.error(`[Compliance] Monthly volume calculation failed for ${userId}:`, err.message);
        return 0;
    }
};

const calculateRiskScore = async (userId, currentAmount) => {
    try {
        const amount = parseFloat(currentAmount);
        
        // 1. Fetch last 10 completed transactions
        const history = await prisma.transaction.findMany({
            where: { senderId: userId, status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Use the Risk Engine (EWMA logic)
        const { score, baseline, deviation, method } = calculateAnomalyScore(amount, history);

        return { 
            score, 
            metadata: { 
                baseline: Math.round(baseline * 100) / 100, 
                deviation: Math.round(deviation * 100) / 100,
                method 
            } 
        };
    } catch (err) {
        console.error('[DRS] Scoring failure:', err.message);
        return { score: 0, metadata: { error: 'Calculation failed' } };
    }
};

/**
 * Automated Compliance Monitoring Engine (AML/BSP Shield)
 * Checks for: High Value (500k), Velocity (5 tx/hr), Aggregate (1M/day), and Dynamic Risk (DRS)
 */
const checkComplianceLimits = async (userId, transaction) => {
    try {
        const amount = parseFloat(transaction.amount);
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const flags = [];

        // 1. Static Rule: High Value Transaction (HVT) - BSP Standard
        if (amount >= 500000) {
            flags.push({ rule: 'HVT', severity: 'HIGH', message: 'Transaction exceeds PHP 500,000 threshold (BSP CTR).' });
        }

        // 2. Static Rule: Velocity Check
        const recentTxCount = await prisma.transaction.count({
            where: {
                senderId: userId,
                createdAt: { gte: oneHourAgo },
                status: 'COMPLETED'
            }
        });
        if (recentTxCount > 5) {
            flags.push({ rule: 'VELOCITY', severity: 'MEDIUM', message: `High frequency activity: ${recentTxCount} transfers in 1 hour.` });
        }

        // 3. Static Rule: Daily Aggregate Limit
        const dailyAgg = await prisma.transaction.aggregate({
            where: {
                senderId: userId,
                createdAt: { gte: twentyFourHoursAgo },
                status: 'COMPLETED'
            },
            _sum: { amount: true }
        });
        const totalDaily = parseFloat(dailyAgg._sum.amount || 0);
        if (totalDaily >= 1000000) {
            flags.push({ rule: 'AGGREGATE', severity: 'HIGH', message: `Cumulative daily volume exceeds PHP 1M limit.` });
        }

        // 4. Dynamic Rule: AI Behavioral Anomaly (v2.4.0)
        const { score, metadata } = await calculateRiskScore(userId, amount);
        if (score >= 50) {
            const severity = score >= 90 ? 'CRITICAL' : (score >= 75 ? 'HIGH' : 'MEDIUM');
            flags.push({ rule: 'ANOMALY', severity, message: `Behavioral Outlier: Score ${score} (${metadata.method}).` });
        }

        // Update transaction with Risk Score
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { riskScore: score, riskMetadata: metadata }
        });

        if (flags.length > 0) {
            console.log(`[Compliance] ${flags.length} rules triggered for user ${userId} | AI Score: ${score}`);
            
            // Create Compliance-specific Audit Log
            const complianceLog = await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'COMPLIANCE_FLAG_TRIGGERED',
                    entity: 'Compliance',
                    entityId: transaction.id,
                    newValue: { 
                        flags, 
                        transactionId: transaction.id, 
                        referenceId: transaction.referenceId,
                        riskScore: score,
                        riskMetadata: metadata
                    },
                    metadata: {
                        isComplianceFlag: true,
                        rulesTriggered: flags.map(f => f.rule),
                        aiWeightedScore: score,
                        severity: flags.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH') ? 'HIGH' : 'MEDIUM'
                    }
                },
                include: { user: { select: { email: true, firstName: true, lastName: true, kycTier: true } } }
            });

            // Notify Admin Board
            notifyAdmin('COMPLIANCE_ALERT', complianceLog);
            
            // Phase 8 Rule: Block if Critical Anomaly
            if (score >= 90) return 'BLOCK';
            return 'FLAG';
        }

        return 'PASS';
    } catch (err) {
        console.error('[Compliance] Monitoring failure:', err.message);
        return 'PASS';
    }
};

// Health Check
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'Transaction Service is healthy', timestamp: getNowUTC() });
});

// P2P Transfer
router.post('/transfer', async (req, res, next) => {
    const referenceId = `BP-${uuidv4().slice(0, 8).toUpperCase()}`;
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ 
                error: 'Bad Request', 
                message: 'Request body is empty or missing. Ensure Content-Type is application/json.' 
            });
        }

        const { senderId, receiverId, recipient, amount, description } = req.body;
    
        // 0. Resolve receiver if recipient (email/phone) is provided instead of ID
        let resolvedReceiverId = receiverId;
        
        if (!resolvedReceiverId && recipient) {
            const variants = getPhoneVariants(recipient);
            
            const recipientUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: recipient },
                        { phoneNumber: { in: variants } }
                    ]
                }
            });
            
            if (!recipientUser) {
                console.warn(`[Transfer] Recipient not found for input: ${recipient} | Variants: ${variants.join(', ')}`);
                throw new Error(`Recipient not found: ${recipient}`);
            }
            resolvedReceiverId = recipientUser.id;
        }

        if (!resolvedReceiverId) {
            throw new Error('Receiver ID or Recipient (email/phone) is required');
        }

        if (resolvedReceiverId === senderId) {
            throw new Error('Cannot send money to yourself');
        }

        // 1. Create audit log for initiation
        await createAuditLog(req, senderId, 'P2P_TRANSFER_INITIATED', {
            receiverId: resolvedReceiverId,
            amount,
            referenceId
        });

        // 2. Check KYC limits for sender
        const sender = await prisma.user.findUnique({
            where: { id: senderId }
        });

        if (!sender) throw new Error('Sender not found');

        // Enforcement of tiered limits (Aligned with GCash Basic - v2.4.4)
        // WHY: Prevents high-volume outbound P2P transfers from non-verified accounts to mitigate money laundering risks (AML Compliance).
        // WHAT: Checks the cumulative monthly outbound volume against a PHP 5,000 ceiling for Users in the 'BASIC' KYC tier.
        // TODO: Move the PHP 5,000 threshold to an environmental variable or dynamic config table.
        if (sender.kycTier === 'BASIC') {
            const monthlyOutbound = await getMonthlyCumulativeVolume(senderId, 'OUTBOUND');
            const newTotal = monthlyOutbound + parseFloat(amount);
            
            if (newTotal > 5000) {
                throw new Error(`Limit Exceeded: BASIC accounts have a PHP 5,000 monthly outbound limit. Current Month: ₱${monthlyOutbound}. Requested: ₱${amount}. Please upgrade to FULLY VERIFIED for higher limits.`);
            }
        }

        const transaction = await prisma.transaction.create({
            data: {
                amount,
                type: 'P2P_TRANSFER',
                status: 'PENDING',
                senderId,
                receiverId: resolvedReceiverId,
                description: description || `P2P Transfer to ${recipient || resolvedReceiverId}`,
                referenceId,
                fee: 0.0
            }
        });

        // 3. Automated Compliance & Risk Check (v2.4.0)
        // Perform check BEFORE fund processing to allow for HELD_FOR_REVIEW state
        const complianceResult = await checkComplianceLimits(senderId, transaction);
        
        if (complianceResult === 'BLOCK') {
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'FLAGGED_REVIEW' }
            });
            
            await createAuditLog(req, senderId, 'P2P_TRANSFER_HELD', {
                reason: 'Critical Anomaly Detected',
                transactionId: transaction.id,
                referenceId
            }, 'Compliance', transaction.id);

            return res.json({ 
                message: 'Transaction held for secondary regulatory review. Please wait for institutional clearance.', 
                status: 'HELD',
                referenceId 
            });
        }

        // 4. Deduct from sender
        const deductRes = await axios.post(`${WALLET_SERVICE_URL}/update-balance`, {
            userId: senderId,
            amount,
            type: 'subtract'
        });

        if (deductRes.status !== 200) throw new Error('Failed to deduct funds from sender');

        // 4. Add to receiver
        const addRes = await axios.post(`${WALLET_SERVICE_URL}/update-balance`, {
            userId: resolvedReceiverId,
            amount,
            type: 'add'
        });

        if (addRes.status !== 200) {
            // Rollback sender
            await axios.post(`${WALLET_SERVICE_URL}/update-balance`, {
                userId: senderId,
                amount,
                type: 'add'
            });
            throw new Error('Failed to add funds to receiver');
        }

        // 5. Create Ledger Entries for Accounting
        // Get Account IDs (Liability: 1010)
        const walletAccount = await prisma.chartOfAccount.findUnique({ where: { code: '1010' } });
        
        if (walletAccount) {
            // Debit Sender's liability portion (decreasing liability)
            await prisma.ledgerEntry.create({
                data: {
                    accountId: walletAccount.id,
                    transactionId: transaction.id,
                    referenceId,
                    description: `P2P Transfer Out: ${description || 'Transfer'}`,
                    debit: amount,
                    credit: 0
                }
            });

            // Credit Receiver's liability portion (increasing liability)
            await prisma.ledgerEntry.create({
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

        // 5. Update transaction to COMPLETED
        const completedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
                status: 'COMPLETED',
                completedAt: new Date()
            },
            include: {
                sender: { select: { email: true, firstName: true, lastName: true } },
                receiver: { select: { email: true, firstName: true, lastName: true } }
            }
        });

        // 5.1 WHY: Only ONE audit log is created here using the centralized createAuditLog() helper.
        //      The previous direct prisma.auditLog.create() call was REMOVED because it duplicated
        //      the audit entry — both writes used action: 'P2P_TRANSFER_COMPLETED' for the same
        //      transaction, causing double entries in the Forensic Audit Trail.
        //      createAuditLog() is the canonical path (includes IP, device, compliance metadata).
        const completedAuditLog = await createAuditLog(req, senderId, 'P2P_TRANSFER_COMPLETED', {
            transactionId: completedTransaction.id,
            receiverId: resolvedReceiverId,
            amount,
            referenceId,
            type: completedTransaction.type,
            compliance: 'BSP Circular No. 808'
        }, 'Financial', completedTransaction.id);

        // 5.2 Notify Admin in Real-time with the single audit log entry
        if (completedAuditLog) {
            notifyAdmin('AUDIT_LOG_CREATED', completedAuditLog);
        }

        // 6. Notify Parties in Real-time
        const receiverName = `${completedTransaction.receiver.firstName || ''} ${completedTransaction.receiver.lastName || ''}`.trim() || completedTransaction.receiver.email;
        const senderName = `${completedTransaction.sender.firstName || ''} ${completedTransaction.sender.lastName || ''}`.trim() || completedTransaction.sender.email;

        notifyUpdate(senderId, 'transaction_update', { 
            message: `Sent PHP ${amount} to ${receiverName}`, 
            transaction: completedTransaction 
        });
        notifyUpdate(resolvedReceiverId, 'transaction_update', { 
            message: `Received PHP ${amount} from ${senderName}`, 
            transaction: completedTransaction 
        });

        // 7. Notify Admin in Real-time
        notifyAdmin('new_transaction', completedTransaction);

        // 9. Static thresholds check (already handled by refined engine above in Step 3)
        // Leaving as placeholder for future route-specific rules

        res.json({ message: 'Transfer successful', transaction: completedTransaction });
    } catch (error) {
        if (error.response) {
            console.error('[Transaction] Wallet Service Response Error:', error.response.status, error.response.data);
        }
        console.error('[Transaction] Transfer Error:', error.message);
        
        // 1. Update transaction to FAILED
        const failedTx = await prisma.transaction.update({
            where: { referenceId },
            data: { status: 'FAILED' }
        }).catch(() => null);

        // 2. Create Audit Log for Failure (Compliance)
        if (failedTx) {
            const auditLog = await prisma.auditLog.create({
                data: {
                    userId: failedTx.senderId || 'SYSTEM',
                    action: 'P2P_TRANSFER_FAILED',
                    entity: 'Financial',
                    entityId: failedTx.id,
                    newValue: {
                        amount: failedTx.amount,
                        referenceId: failedTx.referenceId,
                        error: error.message,
                        recipient: req.body.recipient || req.body.receiverId
                    },
                    metadata: {
                        compliance: 'BSP Circular No. 808',
                        standard: 'Financial Transaction Audit',
                        timestamp: new Date().toISOString()
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
            }).catch(() => null);

            if (auditLog) {
                notifyAdmin('AUDIT_LOG_CREATED', auditLog);
            }
        }
        
        res.status(500).json({ error: error.message });
    }
});

// Cash In
router.post('/cash-in', async (req, res) => {
    const { userId, amount, provider, description } = req.body;
    const referenceId = `CI-${uuidv4().slice(0, 8).toUpperCase()}`;
    
    try {
        // 0. Check KYC limits for cash-in
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true }
        });

        if (!user) throw new Error('User not found');

        // Enforcement of BASIC limits (Aligned with GCash Basic - v2.4.4)
        // Wallet Ceiling: ₱10,000 | Monthly Influx: ₱5,000
        if (user.kycTier === 'BASIC') {
            const currentBalance = user.wallet ? parseFloat(user.wallet.balance) : 0;
            const newBalanceValue = currentBalance + parseFloat(amount);
            
            // 1. Check Wallet Ceiling (10k)
            if (newBalanceValue > 10000) {
                throw new Error(`Wallet Limit Exceeded: BASIC accounts have a maximum balance of ₱10,000. Current: ₱${currentBalance}. Requested: ₱${amount}.`);
            }

            // 2. Check Monthly Inbound Flow (5k)
            const monthlyInbound = await getMonthlyCumulativeVolume(userId, 'INBOUND');
            const newInboundTotal = monthlyInbound + parseFloat(amount);

            if (newInboundTotal > 5000) {
                throw new Error(`Incoming Limit Exceeded: BASIC accounts have a PHP 5,000 monthly cash-in limit. Current Month: ₱${monthlyInbound}. Requested: ₱${amount}.`);
            }
        }

        const transaction = await prisma.transaction.create({
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

        // 2. Behavioral Compliance Check (v2.4.0)
        const complianceResult = await checkComplianceLimits(userId, transaction);
        if (complianceResult === 'BLOCK') {
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'FLAGGED_REVIEW' }
            });
            return res.json({ 
                message: 'Deposit flagged for institutional review. Funds will be credited upon clearance.', 
                status: 'HELD',
                referenceId 
            });
        }

        // 3. Add to user's wallet
        const addRes = await axios.post(`${WALLET_SERVICE_URL}/update-balance`, {
            userId: userId,
            amount,
            type: 'add'
        });

        if (addRes.status !== 200) throw new Error('Failed to add funds to wallet');

        // 3. Create Ledger Entries for Accounting
        // Account 1000: Cash at Bank (Asset)
        // Account 1010: User Wallet Balances (Liability)
        const cashAtBankAcc = await prisma.chartOfAccount.findUnique({ where: { code: '1000' } });
        const walletAcc = await prisma.chartOfAccount.findUnique({ where: { code: '1010' } });
        
        if (cashAtBankAcc && walletAcc) {
            // Debit Asset (Cash at Bank increases)
            await prisma.ledgerEntry.create({
                data: {
                    accountId: cashAtBankAcc.id,
                    transactionId: transaction.id,
                    referenceId,
                    description: `Cash In: ${description || 'Deposit'}`,
                    debit: amount,
                    credit: 0
                }
            });

            // Credit Liability (Wallet balances increase)
            await prisma.ledgerEntry.create({
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

        // 4. Update transaction to COMPLETED
        const completedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
                status: 'COMPLETED',
                completedAt: getLegacyManilaDate()
            },
            include: {
                sender: { select: { email: true } },
                receiver: { select: { email: true } }
            }
        });

        // 4.1 Create Compliance Audit Log (BSP Circular 808)
        const auditLog = await prisma.auditLog.create({
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

        // 4.2 Notify Admin in Real-time (AUDIT_LOG_CREATED)
        notifyAdmin('AUDIT_LOG_CREATED', auditLog);

        // 5. Notify Parties in Real-time
        notifyUpdate(userId, 'transaction_update', { 
            message: `Successfully cashed in PHP ${amount}`, 
            transaction: completedTransaction 
        });

        // 6. Notify Admin in Real-time
        notifyAdmin('new_transaction', completedTransaction);

        // 7. Automated Compliance Check
        await checkComplianceLimits(userId, completedTransaction);

        res.json({ message: 'Cash in successful', transaction: completedTransaction });
    } catch (error) {
        console.error('[Transaction] Cash In Error:', error.message);
        // 1. Update transaction to FAILED
        const failedTx = await prisma.transaction.update({
            where: { referenceId },
            data: { status: 'FAILED' }
        }).catch(() => null);

        // 2. Create Audit Log for Failure
        if (failedTx) {
            const auditLog = await prisma.auditLog.create({
                data: {
                    userId: failedTx.receiverId || 'SYSTEM',
                    action: 'CASH_IN_FAILED',
                    entity: 'Financial',
                    entityId: failedTx.id,
                    newValue: {
                        amount: failedTx.amount,
                        referenceId: failedTx.referenceId,
                        error: error.message,
                        provider: req.body.provider
                    },
                    metadata: {
                        compliance: 'BSP Circular No. 808',
                        standard: 'Financial Transaction Audit',
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
            }).catch(() => null);

            if (auditLog) {
                notifyAdmin('AUDIT_LOG_CREATED', auditLog);
            }
        }
        
        res.status(500).json({ error: error.message });
    }
});

// Cash Out
router.post('/cash-out', async (req, res) => {
    const { userId, amount, provider, description, bankAccount } = req.body;
    const referenceId = `CO-${uuidv4().slice(0, 8).toUpperCase()}`;
    
    try {
        // 0. Check KYC limits for cash-out
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true }
        });

        if (!user) throw new Error('User not found');

        // Enforcement of limits: Only FULLY VERIFIED can cash out
        if (user.kycTier !== 'FULLY_VERIFIED') {
            throw new Error(`Verification required: Only FULLY VERIFIED accounts can perform Cash Out. Current tier: ${user.kycTier}`);
        }

        const currentBalance = user.wallet ? parseFloat(user.wallet.balance) : 0;
        if (currentBalance < parseFloat(amount)) {
            throw new Error(`Insufficient Balance: Available balance (₱${currentBalance}) is less than requested amount (₱${amount}).`);
        }

        const transaction = await prisma.transaction.create({
            data: {
                amount,
                type: 'CASH_OUT',
                status: 'PENDING',
                senderId: userId,
                receiverId: null, // External destination
                description: description || `Cash Out via ${provider || 'Bank'}`,
                referenceId,
                fee: 15.0 // Flat fee for cash out
            }
        });

        // 2. Automated Compliance & Risk Check (v2.4.0)
        // Check BEFORE fund deduction
        const complianceResult = await checkComplianceLimits(userId, transaction);
        if (complianceResult === 'BLOCK') {
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'FLAGGED_REVIEW' }
            });
            return res.json({ 
                message: 'Withdrawal held for institutional review. Please wait for clearance.', 
                status: 'HELD',
                referenceId 
            });
        }

        // 3. Deduct from user's wallet
        const totalToDeduct = parseFloat(amount) + 15.0;
        const deductRes = await axios.post(`${WALLET_SERVICE_URL}/update-balance`, {
            userId: userId,
            amount: totalToDeduct,
            type: 'subtract'
        });

        if (deductRes.status !== 200) throw new Error('Failed to deduct funds from wallet');

        // 3. Create Ledger Entries for Accounting
        const cashAtBankAcc = await prisma.chartOfAccount.findUnique({ where: { code: '1000' } });
        const walletAcc = await prisma.chartOfAccount.findUnique({ where: { code: '1010' } });
        const feeIncomeAcc = await prisma.chartOfAccount.findUnique({ where: { code: '4000' } }); // Revenue: Fees

        if (cashAtBankAcc && walletAcc) {
            // Debit Liability (Wallet balances decrease by total amount)
            await prisma.ledgerEntry.create({
                data: {
                    accountId: walletAcc.id,
                    transactionId: transaction.id,
                    referenceId,
                    description: `Cash Out: ${description || 'Withdrawal'}`,
                    debit: totalToDeduct,
                    credit: 0
                }
            });

            // Credit Asset (Cash at Bank decreases by principal amount)
            await prisma.ledgerEntry.create({
                data: {
                    accountId: cashAtBankAcc.id,
                    transactionId: transaction.id,
                    referenceId,
                    description: `Cash Out: ${description || 'Withdrawal'}`,
                    debit: 0,
                    credit: amount
                }
            });

            // Credit Revenue (Fee income increases)
            if (feeIncomeAcc) {
                await prisma.ledgerEntry.create({
                    data: {
                        accountId: feeIncomeAcc.id,
                        transactionId: transaction.id,
                        referenceId,
                        description: `Cash Out Fee: ${referenceId}`,
                        debit: 0,
                        credit: 15.0
                    }
                });
            }
        }

        // 4. Update transaction to COMPLETED
        const completedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
                status: 'COMPLETED',
                completedAt: getLegacyManilaDate()
            },
            include: {
                sender: { select: { email: true } }
            }
        });

        // 4.1 Create Compliance Audit Log (BSP Circular 808)
        const auditLog = await prisma.auditLog.create({
            data: {
                userId: userId,
                action: 'CASH_OUT_COMPLETED',
                entity: 'Financial',
                entityId: completedTransaction.id,
                newValue: {
                    amount: completedTransaction.amount,
                    fee: completedTransaction.fee,
                    referenceId: completedTransaction.referenceId,
                    type: completedTransaction.type,
                    provider: provider,
                    bankAccount: bankAccount ? '***' + bankAccount.slice(-4) : 'N/A'
                },
                metadata: {
                    compliance: 'BSP Circular No. 808',
                    standard: 'Financial Transaction Audit',
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

        // 4.2 Notify Admin in Real-time (AUDIT_LOG_CREATED)
        notifyAdmin('AUDIT_LOG_CREATED', auditLog);

        // 5. Notify Parties in Real-time
        notifyUpdate(userId, 'transaction_update', { 
            message: `Successfully cashed out PHP ${amount} (Fee: ₱15.00)`, 
            transaction: completedTransaction 
        });

        // 6. Notify Admin in Real-time
        notifyAdmin('new_transaction', completedTransaction);

        // 7. Automated Compliance Check
        await checkComplianceLimits(userId, completedTransaction);

        res.json({ message: 'Cash out successful', transaction: completedTransaction });
    } catch (error) {
        console.error('[Transaction] Cash Out Error:', error.message);
        // 1. Update transaction to FAILED
        const failedTx = await prisma.transaction.update({
            where: { referenceId },
            data: { status: 'FAILED' }
        }).catch(() => null);

        // 2. Create Audit Log for Failure
        if (failedTx) {
            const auditLog = await prisma.auditLog.create({
                data: {
                    userId: failedTx.senderId || 'SYSTEM',
                    action: 'CASH_OUT_FAILED',
                    entity: 'Financial',
                    entityId: failedTx.id,
                    newValue: {
                        amount: failedTx.amount,
                        referenceId: failedTx.referenceId,
                        error: error.message,
                        provider: req.body.provider,
                        bankAccount: req.body.bankAccount ? '***' + req.body.bankAccount.slice(-4) : 'N/A'
                    },
                    metadata: {
                        compliance: 'BSP Circular No. 808',
                        standard: 'Financial Transaction Audit',
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
            }).catch(() => null);

            if (auditLog) {
                notifyAdmin('AUDIT_LOG_CREATED', auditLog);
            }
        }
        
        res.status(500).json({ error: error.message });
    }
});

// Resolve Flagged Transaction (Manual Override)
router.post('/resolve', async (req, res) => {
    const { transactionId, action, reason, adminId, adminRole } = req.body; // adminRole: 'MANAGER' or 'GENERAL_MANAGER'
    
    try {
        const tx = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { sender: true, receiver: true }
        });

        if (!tx || tx.status !== 'FLAGGED_REVIEW') {
            return res.status(400).json({ error: 'Transaction not in flagged state' });
        }

        // INSTITUTIONAL CHECK: Four-Eyes Principle (Maker-Checker)
        if (adminRole === 'MANAGER') {
            // Maker Step: Propose Resolution
            await prisma.transaction.update({
                where: { id: transactionId },
                data: {
                    riskMetadata: { 
                        ...tx.riskMetadata, 
                        proposedAction: action, 
                        proposedBy: adminId, 
                        proposedAt: new Date().toISOString(),
                        resolutionNote: reason 
                    }
                }
            });

            // Log Proposal
            await createAuditLog(req, adminId, 'TX_RESOLUTION_PROPOSED', {
                action,
                reason,
                proposedBy: adminId
            }, 'Financial', transactionId);

            return res.json({ 
                message: `Resolution (${action}) proposed and awaiting General Manager authorization.`, 
                status: 'PROPOSED' 
            });
        }

        if (adminRole === 'GENERAL_MANAGER' || adminRole === 'ADMIN') {
            // Checker Step: Finalize Resolution
            if (action === 'APPROVE') {
                // 1. Process fund movement (Critical: Must happen on authorization)
                if (tx.type === 'P2P_TRANSFER' || tx.type === 'P2P') {
                    // a) Subtract from sender (HELD_FOR_REVIEW didn't deduct yet)
                    await axios.post(`${WALLET_SERVICE_URL}/update-balance`, {
                        userId: tx.senderId,
                        amount: tx.amount,
                        type: 'subtract'
                    });

                    // b) Add to receiver
                    await axios.post(`${WALLET_SERVICE_URL}/update-balance`, {
                        userId: tx.receiverId,
                        amount: tx.amount,
                        type: 'add'
                    });

                    // c) Create Ledger Entries (Core Accounting Compliance)
                    const walletAccount = await prisma.chartOfAccount.findUnique({ where: { code: '1010' } });
                    if (walletAccount) {
                        await prisma.ledgerEntry.createMany({
                            data: [
                                {
                                    accountId: walletAccount.id,
                                    transactionId: tx.id,
                                    referenceId: tx.referenceId,
                                    description: `P2P Resolved (Approved): ${tx.description}`,
                                    debit: tx.amount,
                                    credit: 0
                                },
                                {
                                    accountId: walletAccount.id,
                                    transactionId: tx.id,
                                    referenceId: tx.referenceId,
                                    description: `P2P Resolved (Approved): ${tx.description}`,
                                    debit: 0,
                                    credit: tx.amount
                                }
                            ]
                        });
                    }
                } else if (tx.type === 'CASH_IN') {
                    await axios.post(`${WALLET_SERVICE_URL}/update-balance`, {
                        userId: tx.receiverId,
                        amount: tx.amount,
                        type: 'add'
                    });
                }

                // 2. Update status to COMPLETED
                await prisma.transaction.update({
                    where: { id: transactionId },
                    data: { 
                        status: 'COMPLETED',
                        completedAt: getLegacyManilaDate(),
                        riskMetadata: { 
                            ...tx.riskMetadata, 
                            resolution: 'APPROVED', 
                            authorizedBy: adminId, 
                            authorizedAt: new Date().toISOString(),
                            finalReason: reason || tx.riskMetadata?.resolutionNote
                        }
                    }
                });

                // Audit Final Clearance
                await createAuditLog(req, adminId, 'TX_RESOLUTION_AUTHORIZED', {
                    action: 'CLEARANCE_GRANTED',
                    authorizedBy: adminId
                }, 'Financial', transactionId);

                return res.json({ message: "Transaction authorized and funds dispersed successfully." });
            } else {
                // REJECT Workflow
                await prisma.transaction.update({
                    where: { id: transactionId },
                    data: { 
                        status: 'FAILED',
                        riskMetadata: { 
                            ...tx.riskMetadata, 
                            resolution: 'REJECTED', 
                            authorizedBy: adminId,
                            authorizedAt: new Date().toISOString(),
                            finalReason: reason || tx.riskMetadata?.resolutionNote
                        }
                    }
                });

                await createAuditLog(req, adminId, 'TX_RESOLUTION_REJECTED', {
                    action: 'BLOCK_FINALIZED',
                    authorizedBy: adminId
                }, 'Financial', transactionId);

                return res.json({ message: "Transaction blocked and rejection finalized." });
            }
        }

        return res.status(403).json({ error: 'Unauthorized: General Manager or ADMIN clearance required for final resolution.' });
    } catch (error) {
        console.error('[Transaction] Resolution Error:', error.message);
        res.status(500).json({ error: 'Failed to resolve transaction: ' + error.message });
    }
});

// Get Transaction History for a User
router.get('/history/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });
        
        res.json(transactions);
    } catch (error) {
        console.error('[Transaction] History Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
});

// Global Error Handler (Ensures JSON instead of HTML)
app.use((err, req, res, next) => {
    console.error('[Transaction Service] Global Error:', err.stack);
    res.status(err.status || 500).json({
        error: err.name || 'InternalServerError',
        message: err.message || 'An unexpected error occurred',
        path: req.path
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[Transaction Service Error] ${err.stack}`);
    res.status(err.status || 500).json({
        error: err.name || 'InternalServerError',
        message: err.message || 'An unexpected error occurred in the Transaction Service',
        timestamp: getLegacyManilaISO(),
        path: req.path
    });
});

const startDrsHeartbeat = async () => {
    console.log('[DRS Engine] Initializing Pulse Heartbeat...');
    
    const sendPulse = async () => {
        try {
            await prisma.systemSetting.upsert({
                where: { key: 'DRS_ENGINE_HEARTBEAT' },
                update: { value: new Date().toISOString() },
                create: { 
                    key: 'DRS_ENGINE_HEARTBEAT', 
                    value: new Date().toISOString(),
                    group: 'SYSTEM_HEALTH',
                    description: 'Last reported heartbeat from the Transaction/DRS Service'
                }
            });
            console.log(`[DRS Engine] Pulse updated at ${new Date().toLocaleTimeString()}`);
        } catch (err) {
            console.error('[DRS Engine] Heartbeat failure:', err.message);
        }
    };

    // Trigger immediately on startup
    await sendPulse();

    const heartbeat = setInterval(sendPulse, 30000); // 30 seconds
    
    // Ensure the heartbeat does not block process exit (especially in tests)
    if (heartbeat.unref) heartbeat.unref();
};

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Transaction] Service running on http://0.0.0.0:${PORT} (LAN-accessible)`);
    startDrsHeartbeat();
});

module.exports = { app, calculateRiskScore, checkComplianceLimits };
