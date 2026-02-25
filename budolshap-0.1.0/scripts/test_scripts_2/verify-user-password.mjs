import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function verifyPassword(email, password) {
    console.log(`🔐 Verifying password for: ${email}`);

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log('❌ User not found!');
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            console.log('✅ Verification successful! Password matches.');
        } else {
            console.log('❌ Verification failed! Password does NOT match.');
        }

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const email = 'galvezjon59@gmail.com';
const password = 'asakapa';

verifyPassword(email, password);
