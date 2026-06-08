
import { PrismaClient } from '@prisma/client';

// Use environment variable for database connection
const dbUrl = process.env.BUDOLID_DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('FATAL: BUDOLID_DATABASE_URL or DATABASE_URL environment variable is required');
    process.exit(1);
}

const prisma = new PrismaClient({
    datasources: {
        db: { url: dbUrl }
    }
});

async function syncBudolIDPhone() {
    const email = 'reynaldomgalvez@gmail.com';
    const normalizedPhone = '+639484099388'; // E.164 format

    try {
        console.log(`Connecting to budolid schema...`);
        
        // Check current value
        const currentUser = await prisma.$queryRaw`
            SELECT id, email, "phoneNumber" FROM "budolid"."User" WHERE email = ${email}
        `;
        console.log('Current User in budolid:', currentUser);

        if (currentUser && currentUser.length > 0) {
            console.log(`Updating ${email} phone number to ${normalizedPhone}...`);
            
            // Execute raw SQL update
            const result = await prisma.$executeRaw`
                UPDATE "budolid"."User" 
                SET "phoneNumber" = ${normalizedPhone} 
                WHERE email = ${email}
            `;
            
            console.log('Update result (affected rows):', result);

            // Verify update
            const updatedUser = await prisma.$queryRaw`
                SELECT id, email, "phoneNumber" FROM "budolid"."User" WHERE email = ${email}
            `;
            console.log('Verified User in budolid:', updatedUser);
        } else {
            console.log('User not found in budolid schema.');
        }

    } catch (error) {
        console.error('Error syncing budolid phone:', error);
    } finally {
        await prisma.$disconnect();
    }
}

syncBudolIDPhone();
