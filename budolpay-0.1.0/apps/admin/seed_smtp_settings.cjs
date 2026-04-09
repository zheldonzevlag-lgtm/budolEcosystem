// seed_smtp_settings.cjs
// Seeds the SMTP/email notification system settings into the production DB
// so the @budolpay/notifications package can send real emails.
// Settings are loaded from the SystemSetting table with keys matching the UI.

const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../../node_modules/@prisma/client'));

const DATABASE_URL = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require&schema=budolpay";

const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
});

// These match the keys the notifications package reads (getSystemSettings → flat object of key:value)
// and the keys the Notification Settings UI writes to the DB
const settings = [
    // Email provider selection
    { key: 'emailProvider', value: 'GOOGLE', group: 'NOTIFICATIONS', description: 'Active email provider' },
    
    // Google SMTP config (populated from UI)
    { key: 'smtpHost', value: 'smtp.gmail.com', group: 'NOTIFICATIONS', description: 'SMTP Host' },
    { key: 'smtpPort', value: '587', group: 'NOTIFICATIONS', description: 'SMTP Port' },
    { key: 'smtpFrom', value: 'reynaldomgalvez@gmail.com', group: 'NOTIFICATIONS', description: 'Sender email' },
    { key: 'smtpUser', value: 'reynaldomgalvez@gmail.com', group: 'NOTIFICATIONS', description: 'SMTP username' },
    
    // SMS provider (console until a real one is configured)
    { key: 'smsProvider', value: 'CONSOLE', group: 'NOTIFICATIONS', description: 'Active SMS provider' },
    
    // Security settings
    { key: 'SECURITY_RATE_LIMIT_AUTH', value: '10', group: 'SECURITY', description: 'Max login attempts per 15 minutes per IP' },
];

async function main() {
    console.log('[Seeding] SMTP System Settings into production database...');

    for (const setting of settings) {
        await prisma.systemSetting.upsert({
            where: { key: setting.key },
            create: { ...setting, isActive: true },
            update: { value: setting.value, isActive: true }
        });
        console.log(`  ✅ ${setting.key} = ${setting.value}`);
    }

    console.log('\n[NOTE] smtpPass (App Password) must be saved via the UI or set as EMAIL_PASS env var on Vercel.');
    console.log('       Go to: https://budolpay.vercel.app/settings/notifications');
    console.log('       Click "Save Google Settings" after entering the App Password.');
    console.log('\n✅ Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
