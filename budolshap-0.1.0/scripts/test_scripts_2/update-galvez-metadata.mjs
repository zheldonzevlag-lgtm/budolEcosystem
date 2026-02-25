import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function updateMetadata() {
    const email = 'galvezjon59@gmail.com';
    const ssoUserId = 'd64df8de-6349-4bc9-8b68-8df3a8538c2a';
    
    console.log(`🔄 Updating metadata for user ${email} in local BudolShap database...`);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: {
                metadata: {
                    ssoUserId: ssoUserId
                }
            }
        });

        console.log(`✅ Metadata updated for ${user.email}. ssoUserId set to ${ssoUserId}`);
    } catch (error) {
        console.error('Error updating metadata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateMetadata();