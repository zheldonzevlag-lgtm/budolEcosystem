const fs = require('fs');
const path = require('path');

console.log('🔧 Adding DIRECT_URL to .env file...\n');

const envPath = path.join(__dirname, '..', '.env');
let envContent = fs.readFileSync(envPath, 'utf-8');

// Parse existing variables
const lines = envContent.split('\n');
let databaseUrl = '';
let hasDirectUrl = false;

lines.forEach(line => {
    if (line.trim().startsWith('DATABASE_URL=')) {
        databaseUrl = line.split('=')[1];
    }
    if (line.trim().startsWith('DIRECT_URL=')) {
        hasDirectUrl = true;
    }
});

if (!hasDirectUrl && databaseUrl) {
    // Add DIRECT_URL using the same value as DATABASE_URL
    envContent += `\nDIRECT_URL=${databaseUrl}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Added DIRECT_URL to .env file');
} else if (hasDirectUrl) {
    console.log('✅ DIRECT_URL already exists');
} else {
    console.log('❌ DATABASE_URL not found, cannot add DIRECT_URL');
}

console.log('\n🔄 Now you can run:');
console.log('   npx prisma db push');
