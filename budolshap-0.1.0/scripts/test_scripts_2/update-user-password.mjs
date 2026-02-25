import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function updatePassword(email, newPassword) {
    console.log(`🔐 Updating password for: ${email}`);

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log('❌ User not found!');
            return;
        }

        console.log(`✅ User found: ${user.name || user.email}`);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        console.log('✅ Password updated successfully!');

    } catch (error) {
        console.error('Error during password update:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const email = 'galvezjon59@gmail.com';
const newPassword = 'asakapa';

updatePassword(email, newPassword);
