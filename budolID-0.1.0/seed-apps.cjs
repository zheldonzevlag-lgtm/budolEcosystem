// WHY: Seed the core ecosystem apps (budolPay, budolShap) into the new budolid schema
// and update the Vercel production env vars to point at the correct Neon endpoint
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL;

const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
});

async function main() {
    console.log('=== Seeding budolID on working Neon endpoint ===\n');

    try {
        await prisma.$connect();
        console.log('✅ Connected\n');

        // Seed EcosystemApps
        const coreApps = [
            {
                name: 'budolPay',
                apiKey: 'bp_b31ea1888dcb2ba76fdbb776ea8f5b7a',
                apiSecret: crypto.randomBytes(32).toString('hex'),
                redirectUri: 'https://budolpay.vercel.app/api/auth/callback'
            },
            {
                name: 'budolShap',
                apiKey: 'bs_ac2bca9790f9b70f4e21c8a3c2812917',
                apiSecret: crypto.randomBytes(32).toString('hex'),
                redirectUri: 'https://budolshap.vercel.app/auth/callback'
            }
        ];

        for (const app of coreApps) {
            const existing = await prisma.ecosystemApp.findUnique({ where: { apiKey: app.apiKey } });
            if (!existing) {
                await prisma.ecosystemApp.create({ data: app });
                console.log(`  Created: ${app.name} (${app.apiKey})`);
            } else {
                // Update redirect URI to production
                await prisma.ecosystemApp.update({
                    where: { apiKey: app.apiKey },
                    data: { redirectUri: app.redirectUri }
                });
                console.log(`  Updated: ${app.name} → ${app.redirectUri}`);
            }
        }

        // Verify
        const apps = await prisma.ecosystemApp.findMany();
        console.log(`\n✅ ${apps.length} EcosystemApps in budolid schema:`);
        apps.forEach(a => console.log(`   - ${a.name} (${a.apiKey}) → ${a.redirectUri}`));

        const userCount = await prisma.user.count();
        console.log(`\n📊 Users in budolid schema: ${userCount}`);

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
