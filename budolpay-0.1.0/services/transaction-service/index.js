const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { prisma } = require('@budolpay/database');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8003;
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:8002';

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Transaction Service is healthy', timestamp: new Date() });
});

// P2P Transfer
app.post('/transfer', async (req, res) => {
    const { senderId, receiverId, amount, description } = req.body;
    const referenceId = `BP-${uuidv4().slice(0, 8).toUpperCase()}`;
    
    try {
        // 1. Create pending transaction record
        const transaction = await prisma.transaction.create({
            data: {
                amount,
                type: 'P2P_TRANSFER',
                status: 'PENDING',
                senderId,
                receiverId,
                description,
                referenceId,
                fee: 0.0
            }
        });

        // 2. Deduct from sender
        const deductRes = await axios.post(`${WALLET_SERVICE_URL}/update-balance`, {
            userId: senderId,
            amount,
            type: 'subtract'
        });

        if (deductRes.status !== 200) throw new Error('Failed to deduct funds from sender');

        // 3. Add to receiver
        const addRes = await axios.post(`${WALLET_SERVICE_URL}/update-balance`, {
            userId: receiverId,
            amount,
            type: 'add'
        });

        if (addRes.status !== 200) {
            // Rollback sender (Simplistic approach for baseline)
            await axios.post(`${WALLET_SERVICE_URL}/update-balance`, {
                userId: senderId,
                amount,
                type: 'add'
            });
            throw new Error('Failed to add funds to receiver');
        }

        // 4. Update transaction to COMPLETED
        const completedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
                status: 'COMPLETED',
                completedAt: new Date()
            }
        });

        res.json({ message: 'Transfer successful', transaction: completedTransaction });
    } catch (error) {
        // Update transaction to FAILED
        if (error.message) {
            await prisma.transaction.update({
                where: { referenceId },
                data: { status: 'FAILED' }
            }).catch(() => {});
        }
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Transaction Service running on port ${PORT}`);
});
