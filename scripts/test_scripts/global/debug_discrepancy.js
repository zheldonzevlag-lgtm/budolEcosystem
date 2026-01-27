const { PrismaClient: BudolIdPrisma } = require('../budolID-0.1.0/node_modules/@prisma/client');
const { PrismaClient: BudolShapPrisma } = require('../budolshap-0.1.0/node_modules/@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

async function debugUsers() {
    console.log('--- Debugging User Discrepancy ---');

    // 1. Check BudolID
    const budolIdEnv = dotenv.config({ path: path.resolve(__dirname, '../budolID-0.1.0/.env') }).parsed;
    const budolIdPrisma = new BudolIdPrisma({
        datasources: { db: { url: budolIdEnv.DATABASE_URL } }
    });

    try {
        console.log('\n[BudolID] Searching for galvezjon59@gmail.com...');
        const budolIdUser = await budolIdPrisma.user.findUnique({
            where: { email: 'galvezjon59@gmail.com' }
        });
        if (budolIdUser) {
            console.log('✅ Found in BudolID:', {
                id: budolIdUser.id,
                email: budolIdUser.email,
                name: `${budolIdUser.firstName} ${budolIdUser.lastName}`,
                role: budolIdUser.role
            });
        } else {
            console.log('❌ Not found in BudolID');
        }
    } catch (err) {
        console.error('Error querying BudolID:', err.message);
    } finally {
        await budolIdPrisma.$disconnect();
    }

    // 2. Check BudolShap
    const budolShapEnv = dotenv.config({ path: path.resolve(__dirname, '../budolshap-0.1.0/.env.local') }).parsed;
    const budolShapPrisma = new BudolShapPrisma({
        datasources: { db: { url: budolShapEnv.DATABASE_URL } }
    });

    try {
        console.log('\n[BudolShap] Searching for galvezjon59@gmail.com...');
        const budolShapUser = await budolShapPrisma.user.findUnique({
            where: { email: 'galvezjon59@gmail.com' }
        });
        if (budolShapUser) {
            console.log('✅ Found in BudolShap:', {
                id: budolShapUser.id,
                email: budolShapUser.email,
                name: budolShapUser.name,
                accountType: budolShapUser.accountType
            });
        } else {
            console.log('❌ Not found in BudolShap');
        }
    } catch (err) {
        console.error('Error querying BudolShap:', err.message);
    } finally {
        await budolShapPrisma.$disconnect();
    }
}

debugUsers();