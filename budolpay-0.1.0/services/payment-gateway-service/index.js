const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { prisma } = require('@budolpay/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8004;

app.use(bodyParser.json());

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Payment Gateway Service is healthy', timestamp: new Date() });
});

// Create a Payment Intent (Standardized for budol ecosystem)
app.post('/payments/create-intent', async (req, res) => {
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
        type: 'PAYMENT_INTENT',
        status: 'PENDING',
        description: description || `Payment Intent via ${provider}`,
        referenceId: `INTENT-${Date.now()}`,
        metadata: JSON.stringify(metadata || {}),
        fee: 0.0
      }
    });

    // 2. If provider is external, call the respective provider API
    let providerResponse = null;
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
      providerResponse = {
        checkout_url: `https://budolpay.com/checkout/${transaction.referenceId}`,
        id: `bp_intent_${transaction.id}`
      };
    }

    res.status(201).json({
      success: true,
      transactionId: transaction.id,
      referenceId: transaction.referenceId,
      checkoutUrl: providerResponse.checkout_url,
      providerId: providerResponse.id,
      activeProvider: provider
    });

  } catch (error) {
    console.error('Payment Intent Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment intent' });
  }
});

// Webhook for External Providers
app.post('/webhooks/:provider', async (req, res) => {
  const { provider } = req.params;
  const payload = req.body;

  try {
    console.log(`Received webhook from ${provider}:`, payload);

    // 1. Verify Webhook Signature (Placeholder for security)
    // In production, use provider-specific SDKs to verify the signature header

    // 2. Identify the transaction and amount
    // Example for PayMongo/Xendit style payloads
    const referenceId = payload.data?.attributes?.reference_number || payload.external_id;
    const amount = payload.data?.attributes?.amount || payload.amount;
    const status = payload.data?.attributes?.status || payload.status;

    if (status === 'paid' || status === 'COMPLETED') {
      // 3. Update Transaction Status
      const transaction = await prisma.transaction.update({
        where: { referenceId: referenceId },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      // 4. Trigger Wallet Update (Converting "Real Money" to Digital Balance)
      // Only if this is a CASH_IN or PAYMENT type that should reflect in a wallet
      if (transaction.userId) {
        await axios.post(`${process.env.WALLET_SERVICE_URL}/update-balance`, {
          userId: transaction.userId,
          amount: transaction.amount,
          type: 'add'
        });
        console.log(`Successfully credited ${transaction.amount} to user ${transaction.userId}`);
      }

      // 5. Log for Financial Reconciliation
      await prisma.ledgerEntry.create({
        data: {
          accountId: (await prisma.chartOfAccount.findUnique({ where: { code: '1000' } })).id, // Cash at Bank
          referenceId: referenceId,
          description: `Cash-in via ${provider}`,
          debit: parseFloat(amount) / 100, // Assuming amount is in cents
          credit: 0
        }
      });
    }
    
    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

app.listen(PORT, () => {
  console.log(`Payment Gateway Service running on port ${PORT}`);
});
