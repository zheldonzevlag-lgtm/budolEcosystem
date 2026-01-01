const express = require('express');
const cors = require('cors');
const { prisma } = require('@budolpay/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8002;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Wallet Service is healthy', timestamp: new Date() });
});

// Get Balance
app.get('/balance/:userId', async (req, res) => {
    try {
        const wallet = await prisma.wallet.findUnique({
            where: { userId: req.params.userId }
        });
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
        res.json({ balance: wallet.balance, currency: wallet.currency });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Balance (Internal only, should be called by transaction service)
app.post('/update-balance', async (req, res) => {
    const { userId, amount, type } = req.body; // type: 'add' or 'subtract'
    try {
        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
        
        const newBalance = type === 'add' 
            ? parseFloat(wallet.balance) + parseFloat(amount)
            : parseFloat(wallet.balance) - parseFloat(amount);
            
        if (newBalance < 0) return res.status(400).json({ error: 'Insufficient funds' });
        
        const updatedWallet = await prisma.wallet.update({
            where: { userId },
            data: { balance: newBalance }
        });
        
        res.json({ message: 'Balance updated', balance: updatedWallet.balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Wallet Service running on port ${PORT}`);
});
