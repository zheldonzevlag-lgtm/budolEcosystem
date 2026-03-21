import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: "postgresql://budolpostgres:r00tPassword2026!@budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com:5432/budolshap_1db?sslmode=no-verify"
            }
        }
    });

    try {
        console.log("Attempting database connection...");
        
        // 1. Manually add columns using executeRaw
        const columns = [
            'emailProvider TEXT DEFAULT \'GOOGLE\'',
            'smtpHost TEXT DEFAULT \'smtp.gmail.com\'',
            'smtpPort INTEGER DEFAULT 587',
            'smtpUser TEXT',
            'smtpPass TEXT',
            'smtpFrom TEXT',
            'brevoApiKey TEXT',
            'gmassApiKey TEXT',
            'smsProvider TEXT DEFAULT \'CONSOLE\'',
            'zerixApiKey TEXT',
            'itextmoApiKey TEXT',
            'itextmoClientCode TEXT',
            'viberApiKey TEXT',
            'brevoSmsApiKey TEXT',
            'marketingAdConfigs JSONB DEFAULT \'[]\''
        ];

        for (const colDef of columns) {
            const colName = colDef.split(' ')[0];
            try {
                await prisma.$executeRawUnsafe(`ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS ${colDef}`);
                console.log(`Column ${colName} checked/added.`);
            } catch (colErr) {
                console.warn(`Could not add column ${colName}:`, colErr.message);
            }
        }

        // 2. Inject OTP 555555
        const identifier = 'reynaldomgalvez@gmail.com';
        const otp = '555555';
        const salt = await bcrypt.genSalt(12);
        const code = await bcrypt.hash(otp, salt);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins for safety

        await prisma.verificationCode.upsert({
            where: { identifier },
            update: { code, expiresAt, type: 'LOGIN', createdAt: new Date() },
            create: { identifier, code, expiresAt, type: 'LOGIN', createdAt: new Date() }
        });

        console.log(`Successfully injected OTP ${otp} for ${identifier}`);
    } catch (error) {
        console.error('Database Operation Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
