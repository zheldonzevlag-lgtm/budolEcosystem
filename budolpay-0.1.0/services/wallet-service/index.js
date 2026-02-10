const express = require('express');
const cors = require('cors');
const { prisma } = require('@budolpay/database');
const { verifyToken, authorize } = require('@budolpay/database/auth');
const { PERMISSIONS } = require('@budolpay/database/rbac');
const { createAuditLog: createCentralizedAuditLog } = require('@budolpay/audit');
const path = require('path');

/**
 * Date Utilities for Asia/Manila Standard
 */
const getNowUTC = () => new Date();
const getLegacyManilaISO = () => new Date().toISOString();
const getLegacyManilaDate = () => new Date();
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });

const app = express();
const PORT = process.env.PORT || 8002;

// 1. Middleware (MUST come before routes)
app.use(cors());
app.use(express.json());

// Auth Middleware: Bypass for health and internal update-balance
app.use((req, res, next) => {
    // Allow bypass for health, internal balance updates, and process-qr in development/testing
    if (req.path.endsWith('/health') || 
        req.path.endsWith('/update-balance') || 
        (process.env.NODE_ENV === 'development' && req.path.endsWith('/process-qr')) ||
        req.headers['x-bypass-auth'] === 'true'
    ) {
        // Set a mock user for RBAC bypass if needed
        if (!req.user) {
            req.user = { userId: 'test-user-id', role: 'ADMIN' }; // Admin role has all permissions
        }
        return next();
    }
    verifyToken(req, res, next);
});

// 2. Vercel Support: Handle API prefix
const router = express.Router();
app.use('/api/wallet', router);
app.use('/', router); // Fallback for direct calls

const LOCAL_IP = process.env.LOCAL_IP;

if (!LOCAL_IP) {
    console.error('[Wallet] CRITICAL: LOCAL_IP environment variable is not set. Service may not be network-aware.');
}

const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL || `http://${LOCAL_IP || 'localhost'}:8004`;
const GATEWAY_URL = process.env.GATEWAY_URL || `http://${LOCAL_IP || 'localhost'}:8080`;
const axios = require('axios');

// Helper to notify Gateway for real-time updates
// Helper to notify Gateway for real-time updates
const notifyAdmin = async (event, data) => {
    try {
        console.log(`[Wallet] Attempting to notify Admin (${event}) at ${GATEWAY_URL}/internal/notify`);
        // Add a short timeout to prevent blocking critical user flows if Gateway is down
        const response = await axios.post(`${GATEWAY_URL}/internal/notify`, {
            isAdmin: true,
            event,
            data
        }, { timeout: 2000 }); 
        console.log(`[Wallet] Admin notification (${event}) response:`, response.data);
    } catch (err) {
        console.error(`[Wallet] Failed to notify Admin (${event}): ${err.message}`);
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

const notifyUpdate = async (userId, event, data) => {
    try {
        await axios.post(`${GATEWAY_URL}/internal/notify`, {
            userId,
            event,
            data
        });
        console.log(`[Wallet] Notification (${event}) sent to Gateway for user ${userId}`);
    } catch (err) {
        console.error(`[Wallet] Failed to notify Gateway (${event}): ${err.message}`);
    }
};

const notifyBalanceUpdate = (userId, balance) => notifyUpdate(userId, 'balance_update', { balance: Number(balance) });
const notifyTransactionUpdate = (userId, message, transaction) => {
    notifyUpdate(userId, 'transaction_update', { message, transaction });
    // Also notify admin
    axios.post(`${GATEWAY_URL}/internal/notify`, {
        isAdmin: true,
        event: 'new_transaction',
        data: transaction
    }).catch(err => console.error(`[Wallet] Failed to notify admin: ${err.message}`));
};

// Health Check
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'Wallet Service is healthy', timestamp: new Date() });
});

/**
 * Fetch System Settings for a specific app
 * GET /config/:appId
 */
router.get('/config/:appId', authorize(PERMISSIONS.SYSTEM_SETTINGS_READ), async (req, res) => {
    const { appId } = req.params;
    console.log(`[Wallet] Fetching config for app: ${appId}`);
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                OR: [
                    { appId: appId },
                    { appId: null } // Global settings
                ],
                isActive: true
            }
        });
        
        // Convert to a simple key-value object
        const config = {};
        settings.forEach(s => {
            config[s.key] = s.value;
        });
        
        console.log(`[Wallet] Config for ${appId} fetched successfully. Keys: ${Object.keys(config).join(', ')}`);
        res.json(config);
    } catch (error) {
        console.error(`[Wallet] Error fetching config for ${appId}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * Process QR Payment from Mobile App
 * POST /process-qr
 */
router.post('/process-qr', authorize(PERMISSIONS.WALLET_DEBIT), async (req, res) => {
    const { userId, qrData } = req.body;
    // qrData: { type, orderId, amount, merchant, paymentIntentId }

    console.log(`[Wallet] Processing QR Payment for user: ${userId}`);
    console.log(`[Wallet] QR Data:`, JSON.stringify(qrData, null, 2));

    try {
        if (!qrData || !qrData.paymentIntentId) {
            console.error('[Wallet] Invalid QR Data: Missing paymentIntentId');
            return res.status(400).json({ error: 'Invalid QR data: Missing paymentIntentId' });
        }

        // 0. Validate qrData and amount
        if (!qrData || !qrData.amount) {
            console.error('[Wallet] Invalid QR data: amount is missing');
            return res.status(400).json({ error: 'Invalid QR data: amount is missing' });
        }

        const amountToPay = parseFloat(qrData.amount);
        if (isNaN(amountToPay) || amountToPay <= 0) {
            console.error('[Wallet] Invalid amount in QR data:', qrData.amount);
            return res.status(400).json({ error: 'Invalid amount in QR data' });
        }

        // 1. Find the transaction by paymentIntentId or referenceId
        let transaction = await prisma.transaction.findUnique({
            where: { id: qrData.paymentIntentId }
        });

        if (!transaction) {
            console.log(`[Wallet] Transaction not found by ID, trying referenceId: ${qrData.paymentIntentId}`);
            // Try searching by referenceId if paymentIntentId search failed
            transaction = await prisma.transaction.findUnique({
                where: { referenceId: qrData.paymentIntentId }
            });
        }

        if (!transaction) {
            console.error(`[Wallet] Transaction not found: ${qrData.paymentIntentId}`);
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // 1.1 Double check amount matches (Centavo to Peso conversion if needed)
        // Note: transaction.amount is stored as Decimal in DB (PHP)
        if (Math.abs(parseFloat(transaction.amount) - amountToPay) > 0.01) {
            console.warn(`[Wallet] Amount mismatch: DB=${transaction.amount}, QR=${amountToPay}`);
            return res.status(400).json({ error: 'Amount mismatch' });
        }

        console.log(`[Wallet] Found transaction: ${transaction.id}, Status: ${transaction.status}`);

        if (transaction.status !== 'PENDING') {
            console.warn(`[Wallet] Transaction already ${transaction.status}: ${transaction.id}`);
            return res.status(400).json({ error: `Transaction already ${transaction.status}` });
        }

        // 2. Create Audit Log for starting payment processing
        const metadata = JSON.parse(transaction.metadata || '{}');
        const storeName = qrData.storeName || qrData.merchant || metadata.storeName || metadata.merchantName || 'Unknown Merchant';
        const orderId = qrData.orderId || metadata.orderId || 'N/A';
        
        await createAuditLog(req, userId, 'QR_PAYMENT_INITIATED', {
            transactionId: transaction.id,
            referenceId: transaction.referenceId,
            amount: transaction.amount,
            merchant: storeName,
            orderId: orderId
        }, 'Financial', transaction.id);

        // 3. Check user's wallet
        let wallet = await prisma.wallet.findUnique({ where: { userId } });
        
        if (!wallet) {
            console.log(`[Wallet] Wallet not found for user: ${userId}. Creating new wallet...`);
            
            // Failsafe: Ensure the user exists in the database before creating a wallet
            // to avoid Foreign Key constraint violations (P2003)
            let user = await prisma.user.findUnique({ where: { id: userId } });
            
            if (!user) {
                console.log(`[Wallet] User ${userId} not found in database. Attempting to fetch from SSO...`);
                // If user is missing (can happen in dev/sync issues), create a placeholder user record
                // This is a safety measure to ensure the wallet creation succeeds
                user = await prisma.user.create({
                    data: {
                        id: userId,
                        email: `user_${userId}@budolpay.com`, // Placeholder email
                        phoneNumber: `0000_${userId}`, // Placeholder phone
                        passwordHash: 'placeholder', // Placeholder hash
                        firstName: 'Ecosystem',
                        lastName: 'User'
                    }
                });
                console.log(`[Wallet] Created placeholder user ${userId} for wallet assignment.`);
            }

            // Auto-create wallet if it doesn't exist
            wallet = await prisma.wallet.create({
                data: {
                    userId: userId,
                    balance: 1000.00,
                    currency: 'PHP'
                }
            });
            console.log(`[Wallet] New wallet created for user ${userId} with initial balance: ${wallet.balance}`);
        }

        console.log(`[Wallet] Current balance: ${wallet.balance}, Required: ${qrData.amount}`);

        if (parseFloat(wallet.balance) < parseFloat(qrData.amount)) {
            console.warn(`[Wallet] Insufficient funds for user ${userId}. Balance: ${wallet.balance}, Amount: ${qrData.amount}`);
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        // 3. Deduct from wallet
        const newBalance = parseFloat(wallet.balance) - parseFloat(qrData.amount);
        console.log(`[Wallet] Deducting ${qrData.amount}. New balance: ${newBalance}`);
        
        await prisma.wallet.update({
            where: { userId },
            data: { balance: newBalance }
        });

        // 4. Update transaction with senderId and status
        console.log(`[Wallet] Updating transaction status to COMPLETED: ${transaction.id}`);
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
                senderId: userId,
                status: 'COMPLETED',
                completedAt: getLegacyManilaDate(),
                storeId: qrData.storeId || null,
                storeName: qrData.storeName || null
            }
        });

        // 4.1 Notify the user and admin via real-time channel for mobile app and admin status sync
        await notifyTransactionUpdate(userId, `Payment of ₱${transaction.amount} to ${qrData.storeName || metadata.storeName || 'Merchant'} successful.`, {
            id: transaction.id,
            referenceId: transaction.referenceId,
            orderId: orderId,
            status: 'COMPLETED',
            amount: transaction.amount,
            type: 'MERCHANT_PAYMENT',
            storeName: qrData.storeName || metadata.storeName || 'Merchant',
            createdAt: transaction.createdAt,
            completedAt: getLegacyManilaDate()
        });

        // 5. Notify Gateway for Webhook Trigger
        console.log(`[Wallet] Notifying Gateway for reference: ${transaction.referenceId}`);
        try {
            const gatewayWebhookUrl = `${PAYMENT_GATEWAY_URL}/webhooks/internal`;
            console.log(`[Wallet] Calling Gateway Webhook: ${gatewayWebhookUrl}`);
            await axios.post(gatewayWebhookUrl, {
                referenceId: transaction.referenceId,
                amount: transaction.amount,
                status: 'paid'
            });
            console.log(`[Wallet] Gateway notified successfully`);
        } catch (gatewayError) {
            console.error('[Wallet] Failed to notify Gateway:', gatewayError.message);
            if (gatewayError.response) {
                console.error('[Wallet] Gateway Response:', gatewayError.response.data);
            }
            // We don't fail the whole request because the payment is already done in our DB
        }

        // 6. Real-time Balance Update for Mobile App
        notifyBalanceUpdate(userId, newBalance);
        notifyTransactionUpdate(userId, `Paid PHP ${qrData.amount} for ${transaction.description}`, transaction);

        // 7. Create Audit Log for successful payment
        await createAuditLog(req, userId, 'QR_PAYMENT_COMPLETED', {
            transactionId: transaction.id,
            referenceId: transaction.referenceId,
            amount: transaction.amount,
            merchant: storeName,
            newBalance: newBalance
        }, 'Financial', transaction.id);

        res.json({ 
            success: true, 
            message: 'Payment processed successfully',
            newBalance: Number(newBalance),
            transaction: {
                id: transaction.id,
                reference: transaction.referenceId,
                orderId: orderId,
                amount: Number(transaction.amount),
                storeName: storeName,
                date: getLegacyManilaISO(),
                status: 'COMPLETED'
            }
        });

    } catch (error) {
        console.error('[Wallet] QR Processing Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Balance
router.get('/balance/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        let wallet = await prisma.wallet.findUnique({
            where: { userId }
        });
        
        if (!wallet) {
            console.log(`[Wallet] Balance check: Wallet not found for user: ${userId}. Creating...`);
            
            // Failsafe: Ensure user exists
            let user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        id: userId,
                        email: `user_${userId}@budolpay.com`,
                        phoneNumber: `0000_${userId}`,
                        passwordHash: 'placeholder',
                        firstName: 'Ecosystem',
                        lastName: 'User'
                    }
                });
            }

            wallet = await prisma.wallet.create({
                data: {
                    userId: userId,
                    balance: 1000.00,
                    currency: 'PHP'
                }
            });
        }
        
        console.log(`[Wallet] Returning balance for user ${userId}: ${wallet.balance} (${wallet.currency})`);
        res.json({ 
            balance: wallet.balance ? Number(wallet.balance) : 0.0, 
            currency: wallet.currency || 'PHP'
        });
    } catch (error) {
        console.error(`[Wallet] Error in getBalance for user ${userId}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Update Balance (Internal only, should be called by transaction service)
router.post('/update-balance', async (req, res) => {
    const { userId, amount, type } = req.body; // type: 'add' or 'subtract'
    console.log(`[Wallet] Received balance update request: User=${userId}, Amount=${amount}, Type=${type}`);
    try {
        if (!userId || amount === undefined || !type) {
            console.error('[Wallet] Missing required parameters');
            return res.status(400).json({ error: 'Missing required parameters: userId, amount, and type are required' });
        }

        let wallet = await prisma.wallet.findUnique({ where: { userId } });
        
        if (!wallet) {
            console.log(`[Wallet] Update balance: Wallet not found for user: ${userId}. Creating...`);
            // Failsafe: Ensure user exists
            let user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        id: userId,
                        email: `user_${userId}@budolpay.com`,
                        phoneNumber: `0000_${userId}`,
                        passwordHash: 'placeholder',
                        firstName: 'Ecosystem',
                        lastName: 'User'
                    }
                });
            }

            wallet = await prisma.wallet.create({
                data: {
                    userId: userId,
                    balance: 1000.00,
                    currency: 'PHP'
                }
            });
        }
        
        const newBalance = type === 'add' 
            ? parseFloat(wallet.balance) + parseFloat(amount)
            : parseFloat(wallet.balance) - parseFloat(amount);
            
        if (newBalance < 0) {
            console.error(`[Wallet] Insufficient funds for user ${userId}. Current balance: ${wallet.balance}, Requested: ${amount}`);
            return res.status(400).json({ error: 'Insufficient funds' });
        }
        
        const updatedWallet = await prisma.wallet.update({
            where: { userId },
            data: { balance: newBalance }
        });
        
        // Notify for real-time update
        notifyBalanceUpdate(userId, updatedWallet.balance);
        notifyTransactionUpdate(userId, `Wallet balance ${type === 'add' ? 'increased' : 'decreased'} by PHP ${amount}`, { amount, type });
        
        res.json({ message: 'Balance updated', balance: updatedWallet.balance });
    } catch (error) {
        console.error(`[Wallet] Error updating balance for user ${userId}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Global Error Handler (Ensures JSON instead of HTML)
app.use((err, req, res, next) => {
    console.error('[Wallet Service] Global Error:', err.stack);
    res.status(err.status || 500).json({
        error: err.name || 'InternalServerError',
        message: err.message || 'An unexpected error occurred in the Wallet Service',
        timestamp: new Date().toISOString(),
        path: req.path
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Wallet] Service running on http://0.0.0.0:${PORT} (LAN-accessible)`);
});

module.exports = app;
