// WHY: Sync SSO URL to the correct Vercel endpoint for budolpay admin
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const varsToFix = {
    'NEXT_PUBLIC_SSO_URL': 'https://budolid-ten.vercel.app',
    'SSO_URL': 'https://budolid-ten.vercel.app'
};

const tmpFile = path.join(os.tmpdir(), 'vercel-env-val-pay-sso.txt');

for (const [key, value] of Object.entries(varsToFix)) {
    console.log(`Fixing ${key}... (New Value: ${value})`);
    
    // Write clean value to temp file
    fs.writeFileSync(tmpFile, value, { encoding: 'utf8' });

    try {
        execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
    } catch (e) {}

    execSync(`npx vercel env add ${key} production < "${tmpFile}"`, {
        shell: true,
        stdio: ['inherit', 'ignore', 'ignore']
    });
    
    console.log(`✅ Fixed ${key}`);
}

try { fs.unlinkSync(tmpFile); } catch (e) {}
console.log('Done!');
