
const { prisma } = require('d:/IT Projects/budolEcosystem/budolpay-0.1.0/packages/database/index.js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../budolpay-0.1.0/.env') });

async function eraseDatabase() {
    console.log('--- Phase 1: Database Reset (Erase All Records) ---');
    console.log('WARNING: This action is irreversible and will delete all records from the budolpay database.');
    
    try {
        // Order of deletion to respect foreign key constraints
        console.log('Deleting LedgerEntries...');
        await prisma.ledgerEntry.deleteMany();
        
        console.log('Deleting ChartOfAccounts...');
        await prisma.chartOfAccount.deleteMany();
        
        console.log('Deleting Disputes...');
        await prisma.dispute.deleteMany();
        
        console.log('Deleting Transactions...');
        await prisma.transaction.deleteMany();
        
        console.log('Deleting Settlements...');
        await prisma.settlement.deleteMany();
        
        console.log('Deleting Wallets...');
        await prisma.wallet.deleteMany();
        
        console.log('Deleting FavoriteRecipients...');
        await prisma.favoriteRecipient.deleteMany();
        
        console.log('Deleting VerificationDocuments...');
        await prisma.verificationDocument.deleteMany();
        
        console.log('Deleting Sessions...');
        await prisma.session.deleteMany();
        
        console.log('Deleting AuditLogs...');
        await prisma.auditLog.deleteMany();
        
        console.log('Deleting Users...');
        await prisma.user.deleteMany();
        
        console.log('Deleting EcosystemApps...');
        await prisma.ecosystemApp.deleteMany();
        
        console.log('Deleting SystemSettings...');
        await prisma.systemSetting.deleteMany();
        
        console.log('Deleting RateLimits...');
        await prisma.rateLimit.deleteMany();

        console.log('SUCCESS: All records erased from the database.');

        // Phase 2: Verification
        console.log('\n--- Phase 2: Verification ---');
        const userCount = await prisma.user.count();
        const transactionCount = await prisma.transaction.count();
        const auditCount = await prisma.auditLog.count();

        console.log(`Remaining Users: ${userCount}`);
        console.log(`Remaining Transactions: ${transactionCount}`);
        console.log(`Remaining Audit Logs: ${auditCount}`);

        if (userCount === 0 && transactionCount === 0 && auditCount === 0) {
            console.log('VERIFIED: Database is empty.');
        } else {
            console.error('ERROR: Some records remain in the database!');
            process.exit(1);
        }

    } catch (error) {
        console.error('FAILED to erase database:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

eraseDatabase();
