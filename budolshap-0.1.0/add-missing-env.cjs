const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpFile = path.join(os.tmpdir(), 'vercel-env-val2.txt');

const vars = {
    'BUDOL_ID_URL': 'https://budolid-ten.vercel.app',
    'SSO_URL': 'https://budolid-ten.vercel.app'
};

let success = 0;
let fail = 0;

for (const [key, value] of Object.entries(vars)) {
    process.stdout.write(`Setting ${key}... `);
    
    try {
        fs.writeFileSync(tmpFile, value, { encoding: 'utf8' });
        
        try {
            execSync(`vercel env rm ${key} production -y`, { stdio: 'ignore' });
        } catch (_) { }
        
        execSync(`vercel env add ${key} production < "${tmpFile}"`, {
            shell: true,
            stdio: ['inherit', 'ignore', 'ignore']
        });
        
        console.log('✓');
        success++;
    } catch (err) {
        console.log(`✗ (${err.message?.split('\n')[0]})`);
        fail++;
    }
}

try { fs.unlinkSync(tmpFile); } catch (_) {}
console.log(`\nDone! ${success} succeeded, ${fail} failed.`);
