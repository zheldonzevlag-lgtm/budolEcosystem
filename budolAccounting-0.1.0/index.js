const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 8002;

app.use(cors());
app.use(express.json());

// 1. Create Ledger Entry (The Core Accounting Function)
app.post('/ledger/entry', async (req, res) => {
    const { appId, transactionId, referenceId, entries } = req.body;
    
    // entries example: [
    //   { accountCode: '1000', debit: 100, credit: 0, description: 'User Payment' },
    //   { accountCode: '2000', debit: 0, credit: 100, description: 'Merchant Credit' }
    // ]

    try {
        // Validate Double-Entry Balance
        const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
        const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
        
        if (totalDebit !== totalCredit) {
            return res.status(400).json({ error: 'Entries must be balanced (Total Debit must equal Total Credit)' });
        }

        const result = await prisma.$transaction(async (tx) => {
            const createdEntries = [];
            for (const entry of entries) {
                const account = await tx.chartOfAccount.findUnique({ where: { code: entry.accountCode } });
                if (!account) throw new Error(`Account code ${entry.accountCode} not found`);

                const newEntry = await tx.ledgerEntry.create({
                    data: {
                        accountId: account.id,
                        appId,
                        transactionId,
                        referenceId: `${referenceId}-${entry.accountCode}`,
                        description: entry.description,
                        debit: entry.debit,
                        credit: entry.credit
                    }
                });
                createdEntries.push(newEntry);
            }
            return createdEntries;
        });

        res.status(201).json({ message: 'Ledger entries created successfully', entries: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Get Account Balance
app.get('/balance/:accountCode', async (req, res) => {
    const { accountCode } = req.params;
    try {
        const account = await prisma.chartOfAccount.findUnique({ 
            where: { code: accountCode },
            include: { ledgerEntries: true }
        });
        
        if (!account) return res.status(404).json({ error: 'Account not found' });

        const totalDebit = account.ledgerEntries.reduce((sum, e) => sum + Number(e.debit), 0);
        const totalCredit = account.ledgerEntries.reduce((sum, e) => sum + Number(e.credit), 0);
        
        res.json({
            accountName: account.name,
            accountCode: account.code,
            balance: totalDebit - totalCredit
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`budolAccounting Core Service running on port ${PORT}`);
});
