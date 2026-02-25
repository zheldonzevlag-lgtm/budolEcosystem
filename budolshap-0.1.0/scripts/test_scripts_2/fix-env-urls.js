const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing .env file to use correct database URLs...\n');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse the .env file
const lines = envContent.split('\n');
const envVars = {};

lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
            envVars[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
        }
    }
});

// Use db2 variables for DATABASE_URL and DIRECT_URL
if (envVars.db2_PRISMA_DATABASE_URL) {
    envVars.DATABASE_URL = envVars.db2_PRISMA_DATABASE_URL;
    console.log('✅ Set DATABASE_URL to db2_PRISMA_DATABASE_URL');
}

if (envVars.db2_POSTGRES_URL) {
    envVars.DIRECT_URL = envVars.db2_POSTGRES_URL;
    console.log('✅ Set DIRECT_URL to db2_POSTGRES_URL');
}

// Write back to .env
const newLines = Object.entries(envVars).map(([key, value]) => {
    // Quote values that contain special characters
    if (value.includes(' ') || value.includes('$') || value.includes('#')) {
        return `${key}="${value}"`;
    }
    return `${key}=${value}`;
});

fs.writeFileSync(envPath, newLines.join('\n'));

console.log('\n✅ Fixed .env file!');
console.log('\n🔄 Now you can run:');
console.log('   npx prisma db push');
