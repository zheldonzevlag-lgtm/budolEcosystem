const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Environment Variables...\n');

// Read Vercel env
const vercelEnvPath = path.join(__dirname, '..', '.env.vercel.check');
const localEnvPath = path.join(__dirname, '..', '.env.production');

let vercelEnv = {};
let localEnv = {};

// Parse Vercel env
if (fs.existsSync(vercelEnvPath)) {
    const vercelContent = fs.readFileSync(vercelEnvPath, 'utf-8');
    vercelContent.split('\n').forEach(line => {
        const [key] = line.split('=');
        if (key && key.trim() && !key.startsWith('#')) {
            vercelEnv[key.trim()] = true;
        }
    });
}

// Parse local env
if (fs.existsSync(localEnvPath)) {
    const localContent = fs.readFileSync(localEnvPath, 'utf-8');
    localContent.split('\n').forEach(line => {
        const [key] = line.split('=');
        if (key && key.trim() && !key.startsWith('#')) {
            localEnv[key.trim()] = true;
        }
    });
}

// Critical variables needed
const criticalVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_CURRENCY_SYMBOL',
    'ADMIN_EMAILS'
];

console.log('✅ Variables in Vercel:');
Object.keys(vercelEnv).sort().forEach(key => {
    console.log(`   ${key}`);
});

console.log('\n❌ Variables in Local but MISSING in Vercel:');
let missingCount = 0;
Object.keys(localEnv).sort().forEach(key => {
    if (!vercelEnv[key] && !key.startsWith('VERCEL_') && !key.startsWith('NX_') && !key.startsWith('TURBO_')) {
        console.log(`   ${key}`);
        missingCount++;
    }
});

if (missingCount === 0) {
    console.log('   (None - all local variables are in Vercel)');
}

console.log('\n🔴 CRITICAL Variables Status:');
criticalVars.forEach(varName => {
    const status = vercelEnv[varName] ? '✅' : '❌';
    console.log(`   ${status} ${varName}`);
});

console.log('\n📝 Total Variables:');
console.log(`   Vercel: ${Object.keys(vercelEnv).length}`);
console.log(`   Local: ${Object.keys(localEnv).length}`);
console.log(`   Missing: ${missingCount}`);
