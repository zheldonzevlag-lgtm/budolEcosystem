// Using absolute path to the database package
const { prisma } = require('../../budolpay-0.1.0/packages/database/index.js');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'budolpay-secret-key-2025';

async function generateTestToken() {
    try {
        console.log('Fetching user...');
        const user = await prisma.user.findFirst({
            where: {
                wallet: {
                    isNot: null
                }
            },
            include: {
                wallet: true
            }
        });

        if (!user) {
            console.error('No user with a wallet found in database.');
            process.exit(1);
        }

        console.log(`Generating token for User: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
        
        const token = jwt.sign(
            { userId: user.id, role: user.role, type: 'MOBILE' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('\n--- DATA ---');
        console.log(`TOKEN=${token}`);
        console.log(`USER_ID=${user.id}`);
        console.log('--- END DATA ---\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

generateTestToken();
