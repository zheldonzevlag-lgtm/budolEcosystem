// WHY: Set the correct SMTP_PASS for budolshap in Vercel production
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpFile = path.join(os.tmpdir(), 'vercel-env-val-shap-smtp.txt');
const value = 'ppmmobwlpnwrzptu'; // The working App Password

try {
    fs.writeFileSync(tmpFile, value, { encoding: 'utf8' });
    
    console.log('Removing old SMTP_PASS...');
    try { execSync(`npx vercel env rm SMTP_PASS production -y`, { stdio: 'ignore' }); } catch(e) {}
    
    console.log('Adding new SMTP_PASS...');
    execSync(`npx vercel env add SMTP_PASS production < "${tmpFile}"`, {
        shell: true,
        stdio: ['inherit', 'ignore', 'ignore']
    });
    
    console.log('✅ Success!');
} catch (e) {
    console.error('❌ Failed:', e.message);
} finally {
    try { fs.unlinkSync(tmpFile); } catch(e) {}
}
