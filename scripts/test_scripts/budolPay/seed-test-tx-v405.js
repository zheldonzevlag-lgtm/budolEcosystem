const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Simulating Transaction for Dashboard Verification ---');
        
        // 1. Find or create an Asset account
        let assetAccount = await prisma.chartOfAccount.findFirst({
            where: { type: 'ASSET', name: 'Cash on Hand' }
        });

        if (!assetAccount) {
            assetAccount = await prisma.chartOfAccount.create({
                data: {
                    code: '1001',
                    name: 'Cash on Hand',
                    type: 'ASSET',
                    description: 'Physical cash'
                }
            });
        }

        // 2. Add a ledger entry (Debit increases Asset)
        const entry = await prisma.ledgerEntry.create({
            data: {
                accountId: assetAccount.id,
                referenceId: 'REF-' + Date.now(),
                description: 'Test Deposit',
                debit: 5000.00,
                credit: 0.00
            }
        });

        console.log(`Success: Created ledger entry for ${entry.debit} in ${assetAccount.name}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
