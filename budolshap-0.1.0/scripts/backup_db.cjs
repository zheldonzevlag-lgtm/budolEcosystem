const { PrismaClient } = require('@prisma/client-custom-v4');
// Fix BigInt serialization
BigInt.prototype.toJSON = function() { return this.toString() }
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
    const date = '2026-02-24';
    const backupDir = path.join(__dirname, '..', 'backup-db', `db-${date}`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const models = [
        'user', 'product', 'order', 'orderItem', 'rating', 'address', 'coupon', 
        'store', 'storeAddress', 'cart', 'cartItem', 'wallet', 'transaction', 
        'payoutRequest', 'return', 'paymentProof', 'checkout', 'chat', 'message', 
        'webhookEvent', 'verificationCode', 'systemSettings', 'rateLimit', 'auditLog'
    ];

    for (const model of models) {
        try {
            console.log(`Backing up ${model}...`);
            if (prisma[model]) {
                const data = await prisma[model].findMany();
                fs.writeFileSync(
                    path.join(backupDir, `${model}.json`), 
                    JSON.stringify(data, null, 2)
                );
                console.log(`Backed up ${data.length} records for ${model}`);
            } else {
                console.warn(`Model ${model} not found in Prisma client`);
            }
        } catch (error) {
            console.error(`Failed to backup ${model}:`, error);
        }
    }

    console.log(`Backup completed to ${backupDir}`);
    await prisma.$disconnect();
}

backup().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
