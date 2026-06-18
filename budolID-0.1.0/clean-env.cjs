require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpFile = path.join(os.tmpdir(), 'vercel-env-val.txt');
const envFile = '.env.test';

// 1. Pull the raw production env vars
console.log('Pulling current env vars...');
execSync('npx vercel env pull .env.test --environment production -y', { stdio: 'inherit' });

const envFileContent = fs.readFileSync(envFile, 'utf8');
const lines = envFileContent.split('\n');

let success = 0;
let fail = 0;

for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    
    // Some lines might be missing quotes or have extra quotes, 
    // e.g. KEY=""value" \r\n" or KEY="value\r\n"
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    
    const key = match[1];
    let rawValue = match[2];
    
    // Skip empty values
    if (rawValue === '""' || rawValue.trim() === '') {
        console.log(`Skipping empty variable: ${key}`);
        continue;
    }

    // Clean the value
    let value = rawValue;
    // Replace literal \r\n
    value = value.replace(/\\r\\n/g, '').trim();
    // Remove wrapping quotes if they exist
    while (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
    }
    
    // For Vercel variables like VERCEL_OIDC_TOKEN, VERCEL_ENV, we usually skip them
    if (key.startsWith('VERCEL') || key.startsWith('TURBO_') || key === 'NX_DAEMON') {
        continue;
    }

    // Just to be sure, override DATABASE_URL with the exact one if it's DATABASE_URL
    if (key === 'DATABASE_URL') {
        value = process.env.DATABASE_URL + '&schema=budolid';
    }

    console.log(`Setting ${key}...`);
    
    try {
        fs.writeFileSync(tmpFile, value, { encoding: 'utf8' });
        
        try {
            execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
        } catch (_) {}
        
        execSync(`npx vercel env add ${key} production < "${tmpFile}"`, {
            shell: true,
            stdio: ['inherit', 'ignore', 'ignore']
        });
        
        console.log('  ✓');
        success++;
    } catch (err) {
        console.log(`  ✗ (${err.message?.split('\n')[0]})`);
        fail++;
    }
}

// Special case: Ensure JWT_SECRET is set even if it was blank in .env.test
if (!envFileContent.includes('JWT_SECRET')) {
    // If not found, add it manually
}
// But wait, the previous .env.test showed JWT_SECRET=""
try {
    fs.writeFileSync(tmpFile, 'budol-ecosystem-local-secret-key-2024', { encoding: 'utf8' });
    try { execSync(`npx vercel env rm JWT_SECRET production -y`, { stdio: 'ignore' }); } catch(_) {}
    execSync(`npx vercel env add JWT_SECRET production < "${tmpFile}"`, { shell: true, stdio: 'ignore' });
    console.log(`Setting JWT_SECRET... ✓`);
    success++;
} catch (e) { }

try { fs.unlinkSync(tmpFile); } catch (_) {}
console.log(`\nDone! ${success} succeeded, ${fail} failed.`);
