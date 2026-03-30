// seed_budolid_prod.cjs
// Seeds the admin user into the BudolID SSO production database (Prisma Postgres)
// Also fixes the EcosystemApp redirectUri for budolPay to point to Vercel

const path = require('path');

// Use bcryptjs from budolID-0.1.0 node_modules
const bcrypt = require(path.resolve(__dirname, 'node_modules/bcryptjs'));
const { PrismaClient } = require(path.resolve(__dirname, 'generated/client'));

// BudolID production database - same Prisma Postgres, schema=budolid
const DATABASE_URL = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require&schema=budolid";

const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
});

async function main() {
    const email = 'galvezjon59@gmail.com';
    const password = 'Admin123!';
    
    console.log('[Step 1] Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('[Step 2] Upserting admin user in BudolID...');
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
            isVerified: true,
            firstName: 'Jon',
            lastName: 'Galvez',
            phoneNumber: '09123456789'
        },
        create: {
            email,
            password: hashedPassword,
            role: 'ADMIN',
            isVerified: true,
            firstName: 'Jon',
            lastName: 'Galvez',
            phoneNumber: '09123456789'
        }
    });
    console.log('[Step 2] ✅ User upserted:', user.email, '| role:', user.role);

    // Check EcosystemApp for budolPay redirect URI
    console.log('\n[Step 3] Checking EcosystemApp registry...');
    const apps = await prisma.ecosystemApp.findMany();
    console.log('[Step 3] Registered apps:', JSON.stringify(apps, null, 2));

    // Fix redirectUri for budolPay to point to Vercel production
    const budolPayApp = apps.find(a => 
        a.name?.toLowerCase().includes('budolpay') || 
        a.apiKey === 'bp_key_2025'
    );

    if (budolPayApp) {
        const currentUri = budolPayApp.redirectUri;
        console.log(`\n[Step 4] Found budolPay app. Current redirectUri: ${currentUri}`);
        
        if (!currentUri.includes('budolpay.vercel.app')) {
            console.log('[Step 4] Updating redirectUri to Vercel production...');
            await prisma.ecosystemApp.update({
                where: { id: budolPayApp.id },
                data: { redirectUri: 'https://budolpay.vercel.app/api/auth/callback' }
            });
            console.log('[Step 4] ✅ redirectUri updated to: https://budolpay.vercel.app/api/auth/callback');
        } else {
            console.log('[Step 4] ✅ redirectUri already points to Vercel. No change needed.');
        }
    } else {
        console.log('\n[Step 4] budolPay app not found. Creating EcosystemApp record...');
        const newApp = await prisma.ecosystemApp.create({
            data: {
                name: 'budolPay',
                apiKey: 'bp_key_2025',
                redirectUri: 'https://budolpay.vercel.app/api/auth/callback'
            }
        });
        console.log('[Step 4] ✅ Created EcosystemApp:', newApp.name, '| apiKey:', newApp.apiKey);
    }

    console.log('\n✅ BudolID production seeding complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
