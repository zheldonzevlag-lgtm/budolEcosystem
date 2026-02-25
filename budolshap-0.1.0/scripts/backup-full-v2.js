import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client-custom-v4';

// Fix for BigInt serialization
BigInt.prototype.toJSON = function() { return this.toString() }

const prisma = new PrismaClient();

const models = [
    'User', 'Product', 'Order', 'OrderItem', 'Rating', 'Address', 
    'Coupon', 'Store', 'StoreAddress', 'Cart', 'CartItem', 'Wallet', 
    'Transaction', 'PayoutRequest', 'Return', 'PaymentProof', 'Chat', 
    'Message', 'WebhookEvent', 'VerificationCode', 'SystemSettings', 
    'RateLimit', 'AuditLog', 'Checkout'
];

async function backup() {
    const date = new Date().toISOString().split('T')[0];
    // Absolute path as requested by user
    const backupDir = path.join('d:', 'IT Projects', 'budolEcosystem', 'backup-db', `db-${date}`);

    console.log(`Creating backup directory: ${backupDir}`);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`Starting backup...`);

    for (const modelName of models) {
        try {
            // Prisma client properties are usually camelCase, e.g. prisma.user
            const modelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);
            
            if (!prisma[modelKey]) {
                console.warn(`⚠️ Model ${modelKey} not found in prisma client instance.`);
                continue;
            }

            const data = await prisma[modelKey].findMany();
            const filePath = path.join(backupDir, `${modelName}.json`);
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Backed up ${modelName}: ${data.length} records`);
        } catch (error) {
            console.error(`❌ Failed to backup ${modelName}:`, error.message);
        }
    }

    console.log('Backup completed successfully.');
    await prisma.$disconnect();
}

backup().catch(async (e) => {
    console.error('Fatal error during backup:', e);
    await prisma.$disconnect();
    process.exit(1);
});
