import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'budolpay-secret-key-2025';

async function generateTestToken() {
    try {
        // Find a user with a wallet
        const user = await prisma.user.findFirst({
            where: {
                wallets: {
                    some: {}
                }
            },
            include: {
                wallets: true
            }
        });

        if (!user) {
            console.error('No user with a wallet found in database.');
            process.exit(1);
        }

        console.log(`Generating token for User: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
        console.log(`Current Balance: ${user.wallets[0].balance} ${user.wallets[0].currency}`);

        const token = jwt.sign(
            { userId: user.id, role: user.role, type: 'MOBILE' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('\n--- TEST TOKEN ---');
        console.log(token);
        console.log('--- END TOKEN ---\n');

        // Output user ID for the test script
        console.log(`USER_ID=${user.id}`);

    } catch (error) {
        console.error('Error generating token:', error);
    } finally {
        await prisma.$disconnect();
    }
}

generateTestToken();
