// WHY: Sanitize environment variables in Vercel that contain literal \r\n characters
require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const varsToFix = {
    'NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY': process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY,
    'NEXT_PUBLIC_PUSHER_KEY': '7c449017a85bda0ae88a',
    'PUSHER_APP_ID': '2090861'
};

const tmpFile = path.join(os.tmpdir(), 'vercel-env-val-pay-admin.txt');

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
