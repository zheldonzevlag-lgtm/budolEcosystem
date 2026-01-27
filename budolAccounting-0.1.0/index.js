require('dotenv').config();
const { prisma } = require('@budolpay/database');

// Safety Check: Prevent development from connecting to production
const PRODUCTION_DB_KEYWORDS = [
    'db.prisma.io',
    'supabase.co',
    'elephantsql.com',
    'aws.com',
    'google.com',
    'rds.amazonaws.com'
];

function validateAndConfigureEnvironment() {
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    // Automatic Configuration for Production (Vercel)
    if (isProd) {
        if (!process.env.DATABASE_URL && process.env.POSTGRES_PRISMA_URL) {
            process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
            console.log('🔵 [budolAccounting] Automatically configured DATABASE_URL from Vercel Postgres');
        }
    }

    const databaseUrl = process.env.DATABASE_URL || '';
    
    if (!isProd) {
        const isConnectingToProd = PRODUCTION_DB_KEYWORDS.some(keyword => databaseUrl.includes(keyword));
        if (isConnectingToProd) {
            console.error('\n❌ [budolAccounting] SAFETY CRITICAL ERROR:');
            console.error('   The app is running in DEVELOPMENT mode but is attempting to connect to a PRODUCTION database!');
            console.error(`   DATABASE_URL: ${databaseUrl.substring(0, 30)}...`);
            console.error('\n   ACTION REQUIRED:');
            console.error('   Run "npm run db:local" in the project root to switch to local configuration.\n');
            process.exit(1);
        }
    }
}

validateAndConfigureEnvironment();

/**
 * Date Utilities for Asia/Manila Standard
 */
const getNowUTC = () => new Date();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8005;

// Vercel Support: Handle API prefix
const router = express.Router();
app.use('/api/accounting', router);
app.use('/', router); // Fallback for direct calls

app.use(cors());
app.use(express.json());

// Health Check
router.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'Accounting Service is healthy', 
        timestamp: getNowUTC().toISOString() 
    });
});

// 1. Create Ledger Entry (The Core Accounting Function)
router.post('/ledger/entry', async (req, res) => {
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
router.get('/balance/:accountCode', async (req, res) => {
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

app.listen(PORT, '0.0.0.0', () => {
    const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
    console.log(`budolAccounting Service running on http://0.0.0.0:${PORT}`);
    console.log(`Local LAN access at http://${LOCAL_IP}:${PORT}`);
});

module.exports = app;
