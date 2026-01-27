const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto');
const { prisma } = require('@budolpay/database');
const path = require('path');

/**
 * Date Utilities for Asia/Manila Standard
 */
const getNowUTC = () => new Date();
const getLegacyManilaISO = () => new Date().toISOString();
const getLegacyManilaDate = () => new Date();
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });

const app = express();
const PORT = process.env.PORT || 8004;

// Vercel Support: Handle API prefix
const router = express.Router();
router.use(bodyParser.json());
app.use('/api/payment-gw', router);
app.use('/', router); // Fallback for direct calls

const LOCAL_IP = process.env.LOCAL_IP;

if (!LOCAL_IP) {
  console.error('[PaymentGW] CRITICAL: LOCAL_IP environment variable is not set. Service may not be network-aware.');
}

const IS_DEV = process.env.NODE_ENV !== 'production';
const GATEWAY_URL = IS_DEV ? `http://${LOCAL_IP || 'localhost'}:8080` : (process.env.GATEWAY_URL || 'https://api.budolpay.com');

const notifyAdmin = async (event, data) => {
  try {
    await axios.post(`${GATEWAY_URL}/internal/notify`, {
      isAdmin: true,
      event,
      data
    });
    console.log(`[Gateway] Admin notification (${event}) sent to Gateway`);
  } catch (err) {
    console.error(`[Gateway] Failed to notify Admin (${event}): ${err.message}`);
  }
};

const notifyUser = async (userId, event, data) => {
  try {
    await axios.post(`${GATEWAY_URL}/internal/notify`, {
      userId,
      event,
      data
    });
    console.log(`[Gateway] User notification (${event}) sent to Gateway for user ${userId}`);
  } catch (err) {
    console.error(`[Gateway] Failed to notify User (${event}): ${err.message}`);
  }
};

/**
 * Generate a secure, unique reference ID for transactions
 * Format: JON-YYYYMMDDHHMMSS-RANDOM (8 chars)
 */
function generateSecureReferenceId() {
  const timestamp = getLegacyManilaISO()
    .replace(/[-T:.Z]/g, '') // Remove separators
    .slice(0, 14); // Keep YYYYMMDDHHMMSS
  
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `JON-${timestamp}-${randomBytes}`;
}

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'Payment Gateway Service is healthy', timestamp: getLegacyManilaDate() });
});

// Check Transaction Status
router.get('/status/:referenceId', async (req, res) => {
  const { referenceId } = req.params;
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { referenceId: referenceId }
    });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ status: transaction.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a Payment Intent (Standardized for budol ecosystem)
router.post('/create-intent', async (req, res) => {
    const { amount, currency, description, metadata } = req.body;
  let { provider } = req.body;

  try {
    // If provider is not specified, fetch the one configured by admin
    if (!provider) {
      const activeProviderSetting = await prisma.systemSetting.findUnique({
        where: { key: 'ACTIVE_PAYMENT_PROVIDER' }
      });
      provider = activeProviderSetting ? activeProviderSetting.value : 'internal';
    }

    // 1. Log the payment intent in our system
    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type: 'MERCHANT_PAYMENT',
        status: 'PENDING',
        description: description || `Payment Intent via ${provider}`,
        referenceId: generateSecureReferenceId(),
        metadata: JSON.stringify(metadata || {}),
        fee: 0.0
      }
    });

    // 1.1 Create Compliance Audit Log (BSP Circular 808)
    const auditLog = await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_INTENT_CREATED',
        entity: 'Financial',
        entityId: transaction.id,
        newValue: { 
          amount: transaction.amount, 
          referenceId: transaction.referenceId,
          provider 
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

    // 1.2 Notify Admin in Real-time (AUDIT_LOG_CREATED)
    await notifyAdmin('AUDIT_LOG_CREATED', auditLog);

    // 2. If provider is external, call the respective provider API
    let providerResponse = null;
    let qrCode = null;

    if (provider === 'paymongo') {
      providerResponse = {
        checkout_url: `https://checkout.paymongo.com/test_${transaction.referenceId}`,
        id: `pm_intent_${transaction.id}`
      };
    } else if (provider === 'xendit') {
      providerResponse = {
        checkout_url: `https://checkout.xendit.co/v2/${transaction.referenceId}`,
        id: `xnd_intent_${transaction.id}`
      };
    } else if (provider === 'dragonpay') {
      providerResponse = {
        checkout_url: `https://test.dragonpay.ph/Pay.aspx?merchantid=EXAMPLE&refno=${transaction.referenceId}`,
        id: `dp_intent_${transaction.id}`
      };
    } else {
      // Internal budolPay checkout
      const baseUrl = process.env.BASE_URL || `http://${LOCAL_IP}:${PORT}`;
      providerResponse = {
        checkout_url: `${baseUrl}/checkout/${transaction.referenceId}`,
        id: `bp_intent_${transaction.id}`
      };
      
      // Also provide raw QR data for in-page modal support
      qrCode = JSON.stringify({
        type: 'budolpay_payment',
        orderId: metadata.orderId || 'unknown',
        amount: parseFloat(amount),
        storeName: metadata.storeName || metadata.app || 'budolShap Store',
        paymentIntentId: transaction.id,
        referenceId: transaction.referenceId
      });
    }

    res.status(201).json({
      success: true,
      id: transaction.id,
      paymentIntentId: transaction.id,
      transactionId: transaction.id,
      referenceId: transaction.referenceId,
      checkoutUrl: providerResponse.checkout_url,
      qrCode: qrCode, // Added QR code data
      providerId: providerResponse.id,
      activeProvider: provider
    });

  } catch (error) {
    console.error('Payment Intent Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment intent' });
  }
});

/**
 * Render Checkout Page (Internal Provider Only)
 */
router.get('/checkout/:referenceId', async (req, res) => {
  const { referenceId } = req.params;
  const { orderId } = req.query;

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { referenceId: referenceId }
    });

    if (!transaction) {
      return res.status(404).send('Transaction not found');
    }

    const metadata = JSON.parse(transaction.metadata || '{}');
    const amount = transaction.amount;
    const storeName = metadata.storeName || metadata.app || 'budolShap Store';
    const paymentIntentId = transaction.id;

    // The format the mobile app expects
    const qrData = {
      type: 'budolpay_payment',
      orderId: orderId || metadata.orderId || 'unknown',
      amount: amount,
      storeName: storeName,
      paymentIntentId: paymentIntentId
    };

    const qrString = JSON.stringify(qrData);

    // Serve a modern, universal modal-style checkout page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>budolPay Checkout</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
        <style>
          :root {
            --primary-rose: #f43f5e;
            --primary-emerald: #10b981;
            --text-dark: #1e293b;
            --text-muted: #64748b;
            --bg-light: #f8f9fa;
            --card-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0; 
            background-color: #f1f5f9; 
            color: var(--text-dark);
            padding: 1rem;
          }
          
          .modal { 
            background: white; 
            padding: 1.5rem; 
            border-radius: 24px; 
            box-shadow: var(--card-shadow); 
            text-align: center; 
            max-width: 400px; 
            width: 100%; 
            position: relative;
          }

          .close-btn {
            position: absolute;
            top: 1.25rem;
            right: 1.25rem;
            color: #cbd5e1;
            font-size: 1.5rem;
            line-height: 1;
            cursor: pointer;
            border: none;
            background: none;
          }
          
          .header { margin-bottom: 1.5rem; margin-top: 0.5rem; }
          
          .branding { 
            font-size: 1.75rem; 
            font-weight: 800; 
            margin-bottom: 0.75rem; 
            letter-spacing: -0.02em;
          }
          
          .brand-budol { color: #0f172a; }
          .brand-shap { color: var(--primary-emerald); }
          .brand-dot { color: var(--primary-emerald); font-size: 2.5rem; line-height: 0; vertical-align: middle; }
          
          .title { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 0.25rem; }
          .subtitle { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem; }
          .subtitle b { color: var(--primary-rose); font-weight: 600; }
          
          #qrcode-container { 
            background: white; 
            padding: 0.75rem; 
            border: 2px solid #e2e8f0;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 1.5rem;
            max-width: 260px;
          }
          
          canvas { display: block; width: 100% !important; height: auto !important; }
          
          .details-card {
            background-color: #f8fafc;
            border-radius: 16px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            text-align: left;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
            font-size: 0.85rem;
          }
          
          .detail-row:last-child { margin-bottom: 0; }
          
          .detail-label { color: var(--text-muted); }
          .detail-value { font-weight: 600; color: #334155; }
          .detail-value.amount { font-weight: 700; color: #1e293b; }
          .detail-value.ref { font-family: monospace; font-size: 0.75rem; color: var(--text-muted); }
          
          .timer-container { margin-bottom: 1.5rem; }
          .timer-label { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem; }
          #timer { font-size: 1.5rem; font-weight: 700; color: var(--primary-emerald); }
          #timer.warning { color: #ef4444; }
          
          .how-to-pay {
            background-color: #eff6ff;
            border: 1px solid #dbeafe;
            border-radius: 12px;
            padding: 1rem;
            text-align: left;
            font-size: 0.75rem;
            color: #1e40af;
          }
          
          .how-to-pay h3 { 
            margin-top: 0; 
            margin-bottom: 0.5rem; 
            font-size: 0.8rem; 
            font-weight: 700; 
            color: #1e3a8a;
          }
          
          .how-to-pay ol { margin: 0; padding-left: 1.25rem; }
          .how-to-pay li { margin-bottom: 0.25rem; }
          
          .branding-footer {
             margin-top: 1.5rem;
             color: #e2e8f0;
             font-weight: 800;
             font-size: 1rem;
          }

          .success-view { display: none; padding: 2rem 0; }
          .success-icon { color: var(--primary-emerald); font-size: 4rem; margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <div class="modal" id="main-modal">
          <button class="close-btn">&times;</button>
          
          <div id="payment-view">
            <div class="header">
              <div class="branding">
                <span class="brand-budol">budol</span><span class="brand-shap">Shap</span><span class="brand-dot">.</span>
              </div>
              <div class="title">Scan QR Code to Pay</div>
              <div class="subtitle">Use your <b>budolPay</b> app</div>
            </div>
            
            <div id="qrcode-container">
              <canvas id="qrcode"></canvas>
            </div>

            <div class="details-card">
              <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value amount">₱${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">budolShap Owner:</span>
                <span class="detail-value">budolPay</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment ID:</span>
                <span class="detail-value ref">${referenceId}</span>
              </div>
            </div>

            <div class="timer-container">
              <div class="timer-label">Time remaining:</div>
              <div id="timer">10:00</div>
            </div>

            <div class="how-to-pay">
              <h3>How to pay:</h3>
              <ol>
                <li>Open your <b>budolPay</b> app</li>
                <li>Select "Scan QR" / "Pay via QR"</li>
                <li>Scan the code above</li>
              </ol>
            </div>
          </div>

          <div id="success-view" class="success-view">
            <div class="success-icon">✓</div>
            <div class="title">Payment Successful!</div>
            <div class="subtitle">Redirecting back to merchant...</div>
          </div>

          <div class="branding-footer">
            budolShap<span style="color:#10b981">.</span>
          </div>
        </div>

        <script>
          const qrData = ${qrString};
          const canvas = document.getElementById('qrcode');
          
          QRCode.toCanvas(canvas, JSON.stringify(qrData), {
            width: 240,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          }, function (error) {
            if (error) console.error(error);
          });

          // Timer logic
          let timeLeft = 600; // 10 minutes
          const timerElement = document.getElementById('timer');
          
          const updateTimer = () => {
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            timerElement.textContent = mins + ':' + secs.toString().padStart(2, '0');
            
            if (timeLeft < 60) {
              timerElement.classList.add('warning');
            }
            
            if (timeLeft <= 0) {
              clearInterval(timerInterval);
              alert('Payment session expired. Please refresh the page.');
              window.location.reload();
            }
            timeLeft--;
          };
          
          const timerInterval = setInterval(updateTimer, 1000);
          updateTimer();

          // Polling for transaction status
          const referenceId = '${referenceId}';
          const checkStatus = async () => {
            try {
              const response = await fetch('/status/' + referenceId);
              const data = await response.json();
              
              if (data.status === 'COMPLETED') {
                clearInterval(timerInterval);
                clearInterval(pollInterval);
                
                // Show success view
                document.getElementById('payment-view').style.display = 'none';
                document.getElementById('success-view').style.display = 'block';
                
                setTimeout(() => {
                  window.location.href = '${metadata.redirectUri}' || ('http://' + window.location.hostname + ':3000/payment-success');
                }, 2000);
              } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
                alert('Payment ' + data.status.toLowerCase());
                window.location.href = '${metadata.cancelUri}' || ('http://' + window.location.hostname + ':3000/payment-failed');
              }
            } catch (err) {
              console.error('Error checking status:', err);
            }
          };

          const pollInterval = setInterval(checkStatus, 3000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Checkout Page Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Webhook for External and Internal Providers
router.post('/webhooks/:provider', async (req, res) => {
  const { provider } = req.params;
  const payload = req.body;

  try {
    console.log(`Received webhook from ${provider}:`, JSON.stringify(payload, null, 2));

    // 1. Identify the transaction and amount
    const referenceId = payload.referenceId || payload.data?.attributes?.reference_number || payload.external_id;
    const amount = payload.amount || payload.data?.attributes?.amount;
    const status = payload.status || payload.data?.attributes?.status;

    if (!referenceId) {
      console.error('[Gateway] Webhook error: Missing referenceId in payload');
      return res.status(400).send('Missing referenceId');
    }

    if (status === 'paid' || status === 'COMPLETED' || status === 'succeeded') {
      // 2. Check if transaction already completed to avoid duplicate processing
      const existingTx = await prisma.transaction.findUnique({
        where: { referenceId: referenceId }
      });

      if (!existingTx) {
        console.error(`[Gateway] Transaction not found for reference: ${referenceId}`);
        return res.status(404).send('Transaction not found');
      }

      if (existingTx.status === 'COMPLETED') {
        console.log(`[Gateway] Transaction ${referenceId} already COMPLETED. Checking if webhook needs to be triggered anyway.`);
        
        // Even if transaction is already COMPLETED, we might need to trigger the downstream webhook
        // if this is an internal webhook call from the wallet service.
        if (existingTx.type === 'MERCHANT_PAYMENT') {
          const metadata = JSON.parse(existingTx.metadata || '{}');
          if (metadata.app === 'budolShap') {
            console.log(`[Gateway] Re-triggering webhook to budolShap for Order: ${metadata.orderId}`);
            try {
              const BUDOLSHAP_URL = process.env.BUDOLSHAP_URL || `http://${LOCAL_IP}:3001`;
              await axios.post(`${BUDOLSHAP_URL}/api/webhooks/budolpay`, {
                event: 'payment.success',
                data: {
                  id: existingTx.referenceId,
                  paymentIntentId: existingTx.id,
                  amount: existingTx.amount,
                  metadata: metadata
                }
              }, { timeout: 5000 });
              console.log(`[Gateway] Webhook re-sent successfully to budolShap`);
            } catch (webhookError) {
              console.error(`[Gateway] Failed to re-send webhook to budolShap:`, webhookError.message);
            }
          }
        }
        return res.status(200).send('Already processed, webhook triggered');
      }

      // 3. Update Transaction Status
      const transaction = await prisma.transaction.update({
        where: { referenceId: referenceId },
        data: { 
          status: 'COMPLETED',
          completedAt: getLegacyManilaDate()
        }
      });

      // 3.1 Create Compliance Audit Log (BSP Circular 808)
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: transaction.senderId || transaction.receiverId,
          action: 'GATEWAY_PAYMENT_COMPLETED',
          entity: 'Financial',
          entityId: transaction.id,
          newValue: {
            amount: transaction.amount,
            referenceId: transaction.referenceId,
            type: transaction.type,
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

      // 3.2 Notify Admin in Real-time (AUDIT_LOG_CREATED and new_transaction)
      await notifyAdmin('AUDIT_LOG_CREATED', auditLog);
      await notifyAdmin('new_transaction', transaction); // Critical for Admin Dashboard Sync

      // 3.3 Notify User in Real-time (transaction_update) for Mobile App Sync
      if (transaction.senderId) {
        await notifyUser(transaction.senderId, 'transaction_update', {
          transaction: transaction,
          message: `Your payment of ₱${transaction.amount} has been processed successfully.`
        });
      }

      console.log(`[Gateway] Transaction ${referenceId} updated to COMPLETED`);

      // 4. Trigger Webhook to budolShap
      if (transaction.type === 'MERCHANT_PAYMENT') {
        const metadata = JSON.parse(transaction.metadata || '{}');
        if (metadata.app === 'budolShap') {
          console.log(`[Gateway] Triggering webhook to budolShap for Order: ${metadata.orderId}`);
          try {
            const BUDOLSHAP_URL = process.env.BUDOLSHAP_URL || `http://${LOCAL_IP}:3001`;
            await axios.post(`${BUDOLSHAP_URL}/api/webhooks/budolpay`, {
              event: 'payment.success',
              data: {
                id: transaction.referenceId,
                paymentIntentId: transaction.id,
                amount: transaction.amount,
                metadata: metadata
              }
            }, { timeout: 5000 });
            console.log(`[Gateway] Webhook sent successfully to budolShap`);
          } catch (webhookError) {
            console.error(`[Gateway] Failed to send webhook to budolShap:`, webhookError.message);
          }
        }
      }

      // 5. Trigger Wallet Update (Converting "Real Money" to Digital Balance)
      if (transaction.type === 'CASH_IN' && transaction.senderId) {
        try {
          const walletServiceUrl = process.env.WALLET_SERVICE_URL || `http://${LOCAL_IP}:8002`;
          await axios.post(`${walletServiceUrl}/update-balance`, {
            userId: transaction.senderId,
            amount: transaction.amount,
            type: 'add'
          });
          console.log(`[Gateway] Successfully credited ${transaction.amount} to user ${transaction.senderId}`);
        } catch (walletError) {
          console.error(`[Gateway] Failed to update wallet balance:`, walletError.message);
        }
      }

      // 6. Log for Financial Reconciliation (With error handling)
      try {
        const cashAccount = await prisma.chartOfAccount.findUnique({ where: { code: '1000' } });
        if (cashAccount) {
          await prisma.ledgerEntry.create({
            data: {
              accountId: cashAccount.id,
              referenceId: referenceId,
              description: `Payment via ${provider} (${transaction.type})`,
              debit: parseFloat(amount || transaction.amount),
              credit: 0
            }
          });
          console.log(`[Gateway] Ledger entry created for ${referenceId}`);
        } else {
          console.warn(`[Gateway] Chart of Account '1000' not found. Skipping ledger entry.`);
        }
      } catch (ledgerError) {
        console.error(`[Gateway] Ledger Entry Error:`, ledgerError.message);
      }
    } else if (status === 'failed' || status === 'FAILED' || status === 'cancelled' || status === 'CANCELLED') {
      // Handle Failure/Cancellation
      const transaction = await prisma.transaction.update({
        where: { referenceId: referenceId },
        data: { status: status.toUpperCase() }
      });

      const auditLog = await prisma.auditLog.create({
        data: {
          userId: transaction.senderId || transaction.receiverId,
          action: `GATEWAY_PAYMENT_${status.toUpperCase()}`,
          entity: 'Financial',
          entityId: transaction.id,
          newValue: {
            amount: transaction.amount,
            referenceId: transaction.referenceId,
            type: transaction.type,
            provider: provider,
            reason: payload.failure_reason || payload.reason || 'Unknown'
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

      // Notify Admin in Real-time (AUDIT_LOG_CREATED)
      await notifyAdmin('AUDIT_LOG_CREATED', auditLog);

      // 3.3 Notify User in Real-time (transaction_update) for Mobile App Sync
      if (transaction.senderId) {
        await notifyUser(transaction.senderId, 'transaction_update', {
          transaction: transaction,
          message: `Your payment of ₱${transaction.amount} has failed or was cancelled.`
        });
      }

      console.log(`[Gateway] Transaction ${referenceId} updated to ${status.toUpperCase()}`);
    }
    
    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('[Gateway] Webhook Processing Error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// Alias for internal webhook
router.post('/webhooks/internal', (req, res) => {
  req.url = '/webhooks/internal'; // Ensure it's treated as internal
  return app.handle(req, res);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Payment Gateway] Service running on http://0.0.0.0:${PORT} (LAN-accessible)`);
});

module.exports = app;
