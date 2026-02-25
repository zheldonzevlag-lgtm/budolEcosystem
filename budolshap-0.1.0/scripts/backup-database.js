
import { PrismaClient } from '@prisma/client-custom-v4';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const now = new Date();
const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const backupDir = path.join(process.cwd(), 'backup-db', `db-${localDate}`);

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

const models = [
    'user',
    'product',
    'order',
    'store',
    'storeAddress',
    'cart',
    'cartItem',
    'wallet',
    'transaction',
    'payoutRequest',
    'return',
    'paymentProof',
    'checkout',
    'chat',
    'message',
    'orderItem',
    'rating',
    'address',
    'coupon',
    'auditLog',
    'webhookEvent',
    'verificationCode',
    'systemSettings',
    'rateLimit'
];

async function backup() {
    console.log(`Starting backup to ${backupDir}...`);

    for (const model of models) {
        try {
            // Check if model exists in prisma client instance
            if (!prisma[model]) {
                console.warn(`Model ${model} not found in Prisma Client. Skipping.`);
                continue;
            }

            console.log(`Backing up ${model}...`);
            const data = await prisma[model].findMany();
            
            const filePath = path.join(backupDir, `${model}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, (key, value) =>
                typeof value === 'bigint'
                    ? value.toString()
                    : value // return everything else unchanged
            , 2));
            
            console.log(`Saved ${data.length} records to ${filePath}`);
        } catch (error) {
            console.error(`Error backing up ${model}:`, error);
        }
    }

    console.log('Backup completed!');
    await prisma.$disconnect();
}

backup().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
