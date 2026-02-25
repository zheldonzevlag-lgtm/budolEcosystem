import { PrismaClient } from '@prisma/client-custom-v4';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function verifyLocalUser() {
    const email = 'galvezjon59@gmail.com';
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (user) {
            console.log('LOCAL_USER_DATA:', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                accountType: user.accountType,
                isAdmin: user.isAdmin,
                metadata: user.metadata
            }, null, 2));
        } else {
            console.log('LOCAL_USER_NOT_FOUND');
        }
    } catch (error) {
        console.error('Error verifying local user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyLocalUser();