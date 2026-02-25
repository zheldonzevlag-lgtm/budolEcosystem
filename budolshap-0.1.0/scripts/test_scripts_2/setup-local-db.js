/**
 * Setup Script for Local Development
 * 
 * This script helps configure the database for local development
 * Run: node scripts/setup-local-db.js
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env');
const ENV_EXAMPLE = path.join(__dirname, '..', '.env.local.example');

console.log('🚀 Budolshap Local Development Setup\n');

// Check if .env exists
if (fs.existsSync(ENV_FILE)) {
    console.log('✅ .env file found');

    // Read current .env
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');

    // Check for required database variables
    const hasProvider = envContent.includes('DATABASE_PROVIDER');
    const hasDatabaseUrl = envContent.includes('DATABASE_URL');
    const hasDirectUrl = envContent.includes('DIRECT_URL');

    console.log('\n📊 Database Configuration Check:');
    console.log(`   DATABASE_PROVIDER: ${hasProvider ? '✅' : '❌'}`);
    console.log(`   DATABASE_URL: ${hasDatabaseUrl ? '✅' : '❌'}`);
    console.log(`   DIRECT_URL: ${hasDirectUrl ? '✅' : '❌'}`);

    if (!hasProvider || !hasDatabaseUrl || !hasDirectUrl) {
        console.log('\n⚠️  Missing database configuration!');
        console.log('\n📝 Add these lines to your .env file:\n');
        console.log('DATABASE_PROVIDER=mysql');
        console.log('DATABASE_URL=mysql://root:@localhost:3306/budolshap');
        console.log('DIRECT_URL=mysql://root:@localhost:3306/budolshap\n');
    } else {
        console.log('\n✅ Database configuration looks good!');

        // Extract DATABASE_URL to check database name
        const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
        if (dbUrlMatch) {
            const dbUrl = dbUrlMatch[1].trim();
            console.log(`\n🔗 Database URL: ${dbUrl}`);

            // Check if it's MySQL
            if (dbUrl.startsWith('mysql://')) {
                console.log('✅ Using MySQL (correct for local development)');
            } else if (dbUrl.startsWith('postgres://')) {
                console.log('⚠️  Using PostgreSQL - switch to MySQL for local development!');
                console.log('   Update DATABASE_URL to: mysql://root:@localhost:3306/budolshap');
            }
        }
    }

} else {
    console.log('❌ .env file not found!');
    console.log('\n📝 Creating .env file from template...\n');

    if (fs.existsSync(ENV_EXAMPLE)) {
        fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
        console.log('✅ .env file created from .env.local.example');
        console.log('📝 Please edit .env and fill in your credentials\n');
    } else {
        console.log('❌ .env.local.example not found!');
        console.log('\n📝 Creating basic .env file...\n');

        const basicEnv = `# Database Configuration (MySQL - Local)
DATABASE_PROVIDER=mysql
DATABASE_URL=mysql://root:@localhost:3306/budolshap
DIRECT_URL=mysql://root:@localhost:3306/budolshap

# Application Settings
NODE_ENV=development
NEXT_PUBLIC_CURRENCY_SYMBOL=₱
JWT_SECRET=local-development-secret-key-change-in-production

# Add your other environment variables below
`;

        fs.writeFileSync(ENV_FILE, basicEnv);
        console.log('✅ Basic .env file created');
        console.log('📝 Please add your Cloudinary, PayMongo, and other credentials\n');
    }
}

console.log('\n📚 Next Steps:\n');
console.log('1. Ensure WAMP/MySQL is running');
console.log('2. Create database: CREATE DATABASE budolshap;');
console.log('3. Run: npm run prisma:generate');
console.log('4. Run: npm run prisma:migrate');
console.log('5. Run: npm run dev');
console.log('\n📖 For more details, see DATABASE_CONFIG_GUIDE.md\n');
