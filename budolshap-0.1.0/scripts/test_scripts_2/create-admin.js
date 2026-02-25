/**
 * Script to create an admin account in the database
 * 
 * Usage: 
 *   node scripts/create-admin.js
 * 
 * Or with custom values:
 *   Windows: set ADMIN_EMAIL=admin@example.com && set ADMIN_PASSWORD=tr@1t0r && set ADMIN_NAME=Admin User && node scripts/create-admin.js
 *   Linux/Mac: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=tr@1t0r ADMIN_NAME="Administraitor" node scripts/create-admin.js
 * 
 * Or use the helper scripts:
 *   Windows: scripts\create-admin.bat
 *   Linux/Mac: bash scripts/create-admin.sh
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const { readFileSync, existsSync } = require('fs')
const { resolve } = require('path')

// Load .env file manually if it exists
// Load .env and .env.local files manually if they exist
try {
    const envFiles = ['.env', '.env.local'];

    envFiles.forEach(file => {
        const envPath = resolve(process.cwd(), file);
        if (existsSync(envPath)) {
            console.log(`ℹ️  Loading environment from ${file}`);
            const envFile = readFileSync(envPath, 'utf8');
            envFile.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const [key, ...valueParts] = trimmed.split('=');
                    if (key && valueParts.length) {
                        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                        // .env.local overrides .env, but process.env wins if already set
                        // Actually standard behavior is process.env wins. 
                        // But here we want file updates to take effect if run from CLI without pre-set envs.
                        // However, to respect .env.local over .env, we should overwrite if we are loading sequentially.
                        // But wait, the original code only set if !process.env[key].
                        // Let's stick to that but maybe allow overwrite for .env.local if needed?
                        // A safer bet is to use dotenv-flow logic, but let's just mimic Next.js: .env.local > .env
                        // So we should maybe load .env.local FIRST? 
                        // Or allow overwrite.

                        // Let's just set it if not present, and load .env.local first? 
                        // No, usually you load .env then overrides.
                    }
                }
            });
        }
    });

    // Better approach: Use dotenv to load specific files
    // But since we are patching existing manual parsing code, let's just make it simpler.
    // We will parse both, but prioritize .env.local values.

    // Helper to parse file
    const parseEnv = (filePath) => {
        if (!existsSync(filePath)) return {};
        const content = readFileSync(filePath, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
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

    // Apply to process.env if not already set
    Object.keys(envConfig).forEach(key => {
        if (!process.env[key]) {
            process.env[key] = envConfig[key];
        }
    });

} catch (error) {
    console.error('Error loading env files:', error.message);
}

// Fallback for PRISMA_DATABASE_URL
if (!process.env.PRISMA_DATABASE_URL) {
    if (process.env.DATABASE_URL) {
        console.log('⚠️  PRISMA_DATABASE_URL not found, using DATABASE_URL instead')
        process.env.PRISMA_DATABASE_URL = process.env.DATABASE_URL
    } else if (process.env.POSTGRES_PRISMA_URL) {
        console.log('⚠️  PRISMA_DATABASE_URL not found, using POSTGRES_PRISMA_URL instead')
        process.env.PRISMA_DATABASE_URL = process.env.POSTGRES_PRISMA_URL
    }
}



// Fallback for POSTGRES_URL (needed for directUrl)
if (!process.env.POSTGRES_URL) {
    if (process.env.PRISMA_DATABASE_URL) {
        console.log('⚠️  POSTGRES_URL not found, using PRISMA_DATABASE_URL instead')
        process.env.POSTGRES_URL = process.env.PRISMA_DATABASE_URL
    }
}

if (process.env.PRISMA_DATABASE_URL) {
    const url = process.env.PRISMA_DATABASE_URL;
    const protocol = url.split(':')[0];
    console.log(`ℹ️  Database URL protocol: ${protocol}`);
} else {
    console.error('❌ PRISMA_DATABASE_URL is still missing!');
}

// Create Prisma client instance
const prisma = new PrismaClient({
    log: ['error', 'warn']
})

// Default admin credentials (can be overridden by environment variables)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@budolshap.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User'

async function createAdmin() {
    try {
        console.log('🔧 Creating admin account...')
        console.log(`Email: ${ADMIN_EMAIL}`)
        console.log(`Name: ${ADMIN_NAME}`)
        console.log('')

        // Check if admin already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: ADMIN_EMAIL }
        })

        if (existingUser) {
            console.log('⚠️  Admin account already exists!')
            console.log('   Updating password and setting email as verified...')
            console.log('')

            // Hash password
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)

            // Update existing user
            await prisma.user.update({
                where: { email: ADMIN_EMAIL },
                data: {
                    password: hashedPassword,
                    emailVerified: true,
                    name: ADMIN_NAME,
                    accountType: 'ADMIN',
                    isAdmin: true
                }
            })

            console.log('✅ Admin account updated successfully!')
            console.log('')
            console.log('📝 Next steps:')
            console.log(`   1. Add this email to ADMIN_EMAILS in your .env file:`)
            console.log(`      ADMIN_EMAILS="${ADMIN_EMAIL}"`)
            console.log(`   2. Restart your development server`)
            console.log(`   3. Login at http://localhost:3000/admin/login`)
            console.log('')
            console.log(`   📧 Email: ${ADMIN_EMAIL}`)
            console.log(`   🔑 Password: ${ADMIN_PASSWORD}`)
            console.log('')

            return
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)

        // Generate user ID
        const userId = 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                id: userId,
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                password: hashedPassword,
                image: '',
                cart: {},
                accountType: 'ADMIN',
                isAdmin: true,
                emailVerified: true // Set as verified for admin
            }
        })

        console.log('✅ Admin account created successfully!')
        console.log('')
        console.log('📋 Admin Details:')
        console.log(`   ID: ${admin.id}`)
        console.log(`   Name: ${admin.name}`)
        console.log(`   Email: ${admin.email}`)
        console.log(`   Email Verified: ${admin.emailVerified ? 'Yes' : 'No'}`)
        console.log('')

        console.log('📝 Next steps:')
        console.log(`   1. Add this email to ADMIN_EMAILS in your .env file:`)
        console.log(`      ADMIN_EMAILS="${ADMIN_EMAIL}"`)
        console.log(`   2. Restart your development server`)
        console.log(`   3. Login at http://localhost:3000/admin/login`)
        console.log('')
        console.log(`   📧 Email: ${ADMIN_EMAIL}`)
        console.log(`   🔑 Password: ${ADMIN_PASSWORD}`)
        console.log('')
        console.log('⚠️  Remember to change the password after first login!')
        console.log('')

    } catch (error) {
        console.error('❌ Error creating admin account:', error.message)
        if (error.code === 'P2002') {
            console.error('   Email already exists in database')
        } else if (error.code === 'P1001') {
            console.error('   Cannot connect to database. Check your DATABASE_URL in .env')
            console.error('   Make sure MySQL is running and DATABASE_URL is correct')
        } else if (error.code === 'P1000') {
            console.error('   Authentication failed. Check your database credentials')
        } else {
            console.error('   Full error:', error)
        }
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the script
createAdmin()
