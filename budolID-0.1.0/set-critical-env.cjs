require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpFile = path.join(os.tmpdir(), 'vercel-env-val.txt');

const varsToSet = {
    'DATABASE_URL': process.env.DATABASE_URL + '&schema=budolid',
    'BUDOLPAY_DATABASE_URL': process.env.DATABASE_URL + '&schema=budolid',
    'JWT_SECRET': process.env.JWT_SECRET
};

let success = 0;
let fail = 0;

for (const [key, value] of Object.entries(varsToSet)) {
    console.log(`Setting ${key}...`);
    try {
        fs.writeFileSync(tmpFile, value, { encoding: 'utf8' });
        
        try { execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' }); } catch(_) {}
        
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

try { fs.unlinkSync(tmpFile); } catch (_) {}
console.log(`\nDone! ${success} succeeded, ${fail} failed.`);
