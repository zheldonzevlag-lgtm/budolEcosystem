
import { PrismaClient } from '@prisma/client';
import { normalizePhone } from '../lib/utils/phone-utils.js';

const prisma = new PrismaClient();

async function fixUserPhone() {
    const email = 'reynaldomgalvez@gmail.com';
    const targetPhone = '9484099388';
    
    try {
        console.log(`Checking user ${email}...`);
        
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            console.log('User not found.');
            return;
        }

        console.log('Current User Data:', {
            email: user.email,
            phoneNumber: user.phoneNumber
        });

        // Normalize the target phone number
        const normalizedTarget = normalizePhone(targetPhone);
        console.log(`Target Normalized: ${normalizedTarget}`);

        if (user.phoneNumber !== normalizedTarget) {
            console.log(`Updating phone number from '${user.phoneNumber}' to '${normalizedTarget}'...`);
            
            await prisma.user.update({
                where: { email: email },
                data: { phoneNumber: normalizedTarget }
            });
            
            console.log('Update successful!');
        } else {
            console.log('Phone number is already correct/normalized.');
        }

    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixUserPhone();
