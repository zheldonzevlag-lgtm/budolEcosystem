// push_schema_and_seed.cjs
// Runs Prisma db push to create the budolpay schema in Vercel Postgres,
// then seeds the admin user.
// Mirrors local setup: budolshap_1db?schema=budolpay → postgres?schema=budolpay on Vercel

const { execSync } = require('child_process');
const path = require('path');

// Use bcryptjs from the monorepo root node_modules (not app-level)
const bcrypt = require(path.resolve(__dirname, '../../node_modules/bcryptjs'));
const { PrismaClient } = require(path.resolve(__dirname, '../../node_modules/@prisma/client'));

// The Vercel Prisma Postgres connection string with schema=budolpay to mirror local setup
// Local: postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=budolpay
// Prod:  postgres://...@db.prisma.io:5432/postgres?sslmode=require&schema=budolpay
const DATABASE_URL = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require&schema=budolpay";

process.env.DATABASE_URL = DATABASE_URL;
process.env.DIRECT_URL = DATABASE_URL;

async function main() {
    console.log('[Step 1] Pushing Prisma schema to Vercel Postgres (schema: budolpay)...');
    try {
        execSync('npx prisma db push --accept-data-loss', {
            stdio: 'inherit',
            cwd: __dirname,
            env: { ...process.env, DATABASE_URL }
        });
        console.log('[Step 1] ✅ Schema pushed!\n');
    } catch (e) {
        console.error('[Step 1] ❌ Schema push failed:', e.message);
        process.exit(1);
    }

    console.log('[Step 2] Connecting to database and seeding admin user...');
    const prisma = new PrismaClient({
        datasources: { db: { url: DATABASE_URL } }
    });

    try {
        const email = 'galvezjon59@gmail.com';
        const password = 'Admin123!';
        const passwordHash = await bcrypt.hash(password, 12);

        console.log(`[Step 2] Hashing password for ${email}...`);

        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
            await prisma.user.update({
                where: { email },
                data: {
                    passwordHash,
                    role: 'ADMIN',
                    emailVerified: true,
                    kycStatus: 'VERIFIED',
                    firstName: 'Jon',
                    lastName: 'Galvez'
                }
            });
            console.log(`[Step 2] ✅ Updated existing user ${email} → role=ADMIN`);
        } else {
            await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    phoneNumber: `+63917${Date.now().toString().slice(-7)}`,
                    firstName: 'Jon',
                    lastName: 'Galvez',
                    role: 'ADMIN',
                    emailVerified: true,
                    kycStatus: 'VERIFIED'
                }
            });
            console.log(`[Step 2] ✅ Created admin user ${email}`);
        }

        console.log('[Step 3] Seeding system settings (rate limit)...');
        await prisma.systemSetting.upsert({
            where: { key: 'SECURITY_RATE_LIMIT_AUTH' },
            create: {
                key: 'SECURITY_RATE_LIMIT_AUTH',
                value: '10',
                group: 'SECURITY',
                description: 'Max login attempts per 15 minutes per IP'
            },
            update: {}
        });
        console.log('[Step 3] ✅ System settings seeded!');

    } catch (e) {
        console.error('[Step 2/3] ❌ Seeding failed:', e.message);
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }

    console.log('\n✅ Database ready!');
    console.log('🔐 Admin login: galvezjon59@gmail.com / Admin123!');
}

main().catch(console.error);
