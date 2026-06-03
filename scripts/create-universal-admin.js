#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

const EMAIL = process.env.ADMIN_EMAIL || 'admin@budolshap.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const NAME = process.env.ADMIN_NAME || 'Super Admin';

function runScript(scriptPath, cwd) {
  const rel = path.relative(ROOT, scriptPath);
  console.log(`\n> node ${rel}`);
  execSync(`node "${scriptPath}"`, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      ADMIN_EMAIL: EMAIL,
      ADMIN_PASSWORD: PASSWORD,
      ADMIN_NAME: NAME
    }
  });
}

function runInline(code, cwd, label) {
  const tmp = path.join(cwd, `.tmp-${label}.cjs`);
  fs.writeFileSync(tmp, code);
  try {
    console.log(`\n> [${label}] creating admin...`);
    execSync(`node "${tmp}"`, {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        ADMIN_EMAIL: EMAIL,
        ADMIN_PASSWORD: PASSWORD,
        ADMIN_NAME: NAME
      }
    });
  } finally {
    fs.unlinkSync(tmp);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Universal Admin Creator                ║');
  console.log('║   budolshap + budolpay                   ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Name:     ${NAME}`);
  console.log('');

  // ── budolshap ──
  const shapDir = path.join(ROOT, 'budolshap-0.1.0');
  runInline(`
    const bcrypt = require('bcryptjs');
    const { PrismaClient } = require('@prisma/client');
    const { readFileSync, existsSync } = require('fs');
    const { resolve } = require('path');
    const prisma = new PrismaClient();

    // Load .env and .env.local
    const parseEnv = (filePath) => {
      if (!existsSync(filePath)) return {};
      const content = readFileSync(filePath, 'utf8');
      const env = {};
      content.split('\\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length) {
            env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          }
        }
      });
      return env;
    };
    const envConfig = {
      ...parseEnv(resolve(process.cwd(), '.env')),
      ...parseEnv(resolve(process.cwd(), '.env.local'))
    };
    Object.keys(envConfig).forEach(key => {
      if (!process.env[key]) {
        process.env[key] = envConfig[key];
      }
    });
    // Fallback for PRISMA_DATABASE_URL
    if (!process.env.PRISMA_DATABASE_URL) {
      if (process.env.DATABASE_URL) {
        process.env.PRISMA_DATABASE_URL = process.env.DATABASE_URL;
      }
    }
    const email = process.env.ADMIN_EMAIL || 'admin@budolshap.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const name = process.env.ADMIN_NAME || 'Super Admin';
    async function main() {
      const salt = await bcrypt.genSalt(12); // Use 12 rounds like budolshap's auth.js
      const hash = await bcrypt.hash(password, salt);
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        await prisma.user.update({
          where: { email },
          data: {
            password: hash,
            emailVerified: true,
            name,
            accountType: 'ADMIN',
            isAdmin: true
          }
        });
        console.log('  ✅ Updated: ' + email + ' → ADMIN (budolshap)');
      } else {
        const userId = 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await prisma.user.create({
          data: {
            id: userId,
            name,
            email,
            password: hash,
            image: '',
            cart: {},
            accountType: 'ADMIN',
            isAdmin: true,
            emailVerified: true
          }
        });
        console.log('  ✅ Created: ' + email + ' → ADMIN (budolshap)');
      }
    }
    main().catch(e => { console.error('❌ ' + e.message); process.exit(1); }).finally(() => prisma.$disconnect());
  `, shapDir, 'budolshap');

  // ── budolpay (apps/admin schema) ──
  const payDir = path.join(ROOT, 'budolpay-0.1.0', 'apps', 'admin');
  runInline(`
    const bcrypt = require('bcryptjs');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL || process.env.BUDOLPAY_DATABASE_URL } }
    });
    const email = process.env.ADMIN_EMAIL || 'admin@budolshap.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const name = process.env.ADMIN_NAME || 'Super Admin';
    async function main() {
      const hashedPassword = await bcrypt.hash(password, 10);
      const firstName = name.split(' ')[0] || name;
      const lastName = name.split(' ').slice(1).join(' ') || 'Admin';
      const phoneNumber = process.env.ADMIN_PHONE || '09170000000';
      const id = 'admin_' + Date.now();
      
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          passwordHash: hashedPassword,
          role: 'ADMIN',
          emailVerified: true,
          firstName,
          lastName,
          phoneNumber
        },
        create: {
          id,
          email,
          passwordHash: hashedPassword,
          role: 'ADMIN',
          emailVerified: true,
          firstName,
          lastName,
          phoneNumber
        }
      });

      console.log('  ✅ Admin ready:', email, '→ ADMIN (budolpay)');
    }
    main().catch(e => { console.warn('  ⚠️ Skipping budolpay admin:', e.message); }).finally(() => prisma.$disconnect());
  `, payDir, 'budolpay');

  // ── budolID (SSO) ──
  const idDir = path.join(ROOT, 'budolID-0.1.0');
  runInline(`
    const bcrypt = require('bcryptjs');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const email = process.env.ADMIN_EMAIL || 'admin@budolshap.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const name = process.env.ADMIN_NAME || 'Super Admin';
    const phoneNumber = process.env.ADMIN_PHONE || '+639170000000';
    async function main() {
      const hash = await bcrypt.hash(password, 10);
      const firstName = name.split(' ')[0] || name;
      const lastName = name.split(' ').slice(1).join(' ') || 'Admin';
      
      await prisma.user.upsert({
        where: { email },
        update: {
          passwordHash: hash,
          firstName,
          lastName,
          role: 'ADMIN',
          emailVerified: true,
          phoneVerified: true
        },
        create: {
          email,
          passwordHash: hash,
          phoneNumber,
          firstName,
          lastName,
          role: 'ADMIN',
          emailVerified: true,
          phoneVerified: true
        }
      });
      
      console.log('  ✅ Admin ready: ' + email + ' → ADMIN (budolID)');
    }
    main().catch(e => { console.error('❌ ' + e.message); process.exit(1); }).finally(() => prisma.$disconnect());
  `, idDir, 'budolID');

  console.log('\n══════════════════════════════════════════');
  console.log('  ✅ All admins ready!');
  console.log(`  📧 ${EMAIL}`);
  console.log(`  🔑 ${PASSWORD}`);
  console.log('══════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
