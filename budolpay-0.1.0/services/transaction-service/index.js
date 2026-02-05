const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { prisma } = require('@budolpay/database');
const { verifyToken, authorize } = require('@budolpay/database/auth');
const { PERMISSIONS } = require('@budolpay/database/rbac');
const { createAuditLog: createCentralizedAuditLog } = require('@budolpay/audit');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

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
            const recipientUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: recipient },
                        { phoneNumber: recipient }
                    ]
                }
            });
            
            if (!recipientUser) {
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

        // Enforcement of tiered limits
        if (sender.kycTier === 'BASIC') {
            throw new Error('Verification required: BASIC accounts cannot send money P2P. Please upgrade to FULLY VERIFIED.');
        }

        // 2. Create pending transaction record
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

        // 3. Deduct from sender
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

        // 5.1 Create Compliance Audit Log (BSP Circular 808)
        const auditLog = await prisma.auditLog.create({
            data: {
                userId: senderId,
                action: 'P2P_TRANSFER_COMPLETED',
                entity: 'Financial',
                entityId: completedTransaction.id,
                newValue: {
                    amount: completedTransaction.amount,
                    referenceId: completedTransaction.referenceId,
                    type: completedTransaction.type,
                    receiverId: completedTransaction.receiverId
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
        });

        // 5.2 Notify Admin in Real-time (AUDIT_LOG_CREATED)
        notifyAdmin('AUDIT_LOG_CREATED', auditLog);

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

        // 8. Create forensic audit log for completion
        await createAuditLog(req, senderId, 'P2P_TRANSFER_COMPLETED', {
            transactionId: completedTransaction.id,
            receiverId: resolvedReceiverId,
            amount,
            referenceId
        }, 'Financial', completedTransaction.id);

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

        // Enforcement of BASIC limits (₱5,000 max balance)
        if (user.kycTier === 'BASIC') {
            const currentBalance = user.wallet ? parseFloat(user.wallet.balance) : 0;
            const newBalance = currentBalance + parseFloat(amount);
            
            if (newBalance > 5000) {
                throw new Error(`Limit Exceeded: BASIC accounts have a maximum wallet balance of ₱5,000. Current: ₱${currentBalance}. Requested: ₱${amount}.`);
            }
        }

        // 1. Create pending transaction record
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

        // 2. Add to user's wallet
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

        // 1. Create pending transaction record
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

        // 2. Deduct from user's wallet
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Transaction] Service running on http://0.0.0.0:${PORT} (LAN-accessible)`);
});

module.exports = app;
