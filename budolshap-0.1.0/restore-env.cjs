/**
 * WHY: Vercel env vars were accidentally saved with extra quotes and \r\n suffixes
 * (from Windows CRLF encoding when initially set via a script).
 * This script restores all budolshap production env vars to their clean values
 * by writing each value to a temp file and using stdin redirection.
 * 
 * Source of truth: .env.check_prod (a previously clean snapshot)
 */
require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpFile = path.join(os.tmpdir(), 'vercel-env-val.txt');

// Clean values sourced from .env.check_prod snapshot + known production values
const vars = {
    'CLOUDINARY_API_KEY': '537684148625265',
    'CLOUDINARY_API_SECRET': 'USb6SDEDehMLyw9_HlFC1wDqlDE',
    'DATABASE_URL': 'postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require',
    'DIRECT_URL': 'postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require',
    'ENABLE_LALAMOVE': 'true',
    'JWT_SECRET': process.env.JWT_SECRET,
    'LALAMOVE_CLIENT_ID': process.env.LALAMOVE_CLIENT_ID,
    'LALAMOVE_CLIENT_SECRET': process.env.LALAMOVE_CLIENT_SECRET,
    'LALAMOVE_ENV': 'sandbox',
    'LALAMOVE_WEBHOOK_SECRET': 'lalamove_webhook_secret_budolshap_2025',
    'NEXT_PUBLIC_APP_URL': 'https://budolshap.vercel.app',
    'NEXT_PUBLIC_BASE_URL': 'https://budolshap.vercel.app',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME': 'dasfwpg7x',
    'NEXT_PUBLIC_CURRENCY_SYMBOL': '₱',
    'NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY': process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY,
    'NEXT_PUBLIC_PUSHER_CLUSTER': 'ap1',
    'NEXT_PUBLIC_PUSHER_KEY': '7c449017a85bda0ae88a',
    'NEXT_PUBLIC_SSO_URL': 'https://budolid-ten.vercel.app',
    'PAYMONGO_SECRET_KEY': process.env.PAYMONGO_SECRET_KEY,
    'PUSHER_APP_ID': '2090861',
    'PUSHER_SECRET': '2ceb82a5951aa226ce93',
    'SMTP_FROM': 'reynaldomgalvez@gmail.com',
    'SMTP_HOST': 'smtp.gmail.com',
    'SMTP_PASS': 'ajwp odmh oqbh ahkd',
    'SMTP_PORT': '587',
    'SMTP_USER': 'reynaldomgalvez@gmail.com',
};

let success = 0;
let fail = 0;

for (const [key, value] of Object.entries(vars)) {
    process.stdout.write(`Setting ${key}... `);
    
    try {
        // Write value WITHOUT BOM and WITHOUT trailing newline to a temp file
        fs.writeFileSync(tmpFile, value, { encoding: 'utf8' });
        
        // Remove old value first (--force would work too but let's be explicit)
        try {
            execSync(`vercel env rm ${key} production -y`, { stdio: 'ignore' });
        } catch (_) { /* ok if doesn't exist */ }
        
        // Add using file redirection - clean, no extra characters
        execSync(`vercel env add ${key} production < "${tmpFile}"`, {
            shell: true,
            stdio: ['inherit', 'ignore', 'ignore']
        });
        
        console.log('✓');
        success++;
    } catch (err) {
        console.log(`✗ (${err.message?.split('\n')[0]})`);
        fail++;
    }
}

// Clean up temp file
try { fs.unlinkSync(tmpFile); } catch (_) {}

console.log(`\nDone! ${success} succeeded, ${fail} failed.`);
