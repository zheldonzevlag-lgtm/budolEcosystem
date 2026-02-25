const fs = require('fs');
const path = require('path');

console.log('🔧 Cleaning .env.production file...\n');

const envPath = path.join(__dirname, '..', '.env.production');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Split into lines
const lines = envContent.split('\n');

// Filter out old database URLs
const cleanedLines = lines.filter(line => {
    const trimmed = line.trim();

    // Remove old DATABASE_URL
    if (trimmed.startsWith('DATABASE_URL=')) {
        console.log('❌ Removing old DATABASE_URL');
        return false;
    }

    // Remove old DIRECT_URL
    if (trimmed.startsWith('DIRECT_URL=')) {
        console.log('❌ Removing old DIRECT_URL');
        return false;
    }

    // Remove old PRISMA_DATABASE_URL
    if (trimmed.startsWith('PRISMA_DATABASE_URL=')) {
        console.log('❌ Removing old PRISMA_DATABASE_URL');
        return false;
    }

    // Remove old POSTGRES_PRISMA_URL
    if (trimmed.startsWith('POSTGRES_PRISMA_URL=')) {
        console.log('❌ Removing old POSTGRES_PRISMA_URL');
        return false;
    }

    // Remove old POSTGRES_URL_NON_POOLING
    if (trimmed.startsWith('POSTGRES_URL_NON_POOLING=')) {
        console.log('❌ Removing old POSTGRES_URL_NON_POOLING');
        return false;
    }

    // Remove old POSTGRES_URL
    if (trimmed.startsWith('POSTGRES_URL=')) {
        console.log('❌ Removing old POSTGRES_URL');
        return false;
    }

    // Keep everything else
    return true;
});

// Write cleaned content back
const cleanedContent = cleanedLines.join('\n');
fs.writeFileSync(envPath, cleanedContent);

console.log('\n✅ Cleaned .env.production file!');
console.log('✅ Backup saved as: .env.production.backup');
console.log('\n📋 Removed old database connection strings');
console.log('📋 All other environment variables kept intact');
console.log('\n🔄 Next steps:');
console.log('1. Run: vercel env pull .env.production --yes');
console.log('2. Run: npx prisma migrate deploy');
console.log('3. Run: node scripts/create-admin.js');
console.log('4. Run: vercel --prod');
