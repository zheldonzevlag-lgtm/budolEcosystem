import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function createUser() {
    const email = 'galvezjon59@gmail.com';
    const password = 'asakapa'; // Matches the password in budolID sync script
    
    console.log(`🔄 Creating user ${email} in local BudolShap database...`);

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.upsert({
            where: { email },
            update: { 
                password: hashedPassword,
                emailVerified: true,
                isAdmin: true,
                accountType: 'ADMIN'
            },
            create: {
                id: 'galvez-jon-59-id', // Specific ID for consistency if needed
                name: 'Jon Galvez',
                email,
                password: hashedPassword,
                phoneNumber: '09171234567',
                image: 'https://ui-avatars.com/api/?name=Jon+Galvez',
                emailVerified: true,
                isAdmin: true,
                accountType: 'ADMIN'
            }
        });

        console.log(`✅ User ${user.email} created/updated successfully in BudolShap!`);
    } catch (error) {
        console.error('Error creating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createUser();