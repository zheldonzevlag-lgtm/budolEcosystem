// WHY: Make budolshap JWT_SECRET match the rest of the ecosystem (budolID, budolpay)
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpFile = path.join(os.tmpdir(), 'vercel-env-val-shap-jwt.txt');
const value = 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc='; // Canonical Ecosystem Secret

try {
    fs.writeFileSync(tmpFile, value, { encoding: 'utf8' });
    
    console.log('Removing old JWT_SECRET...');
    try { execSync(`npx vercel env rm JWT_SECRET production -y`, { stdio: 'ignore' }); } catch(e) {}
    
    console.log('Adding new JWT_SECRET...');
    execSync(`npx vercel env add JWT_SECRET production < "${tmpFile}"`, {
        shell: true,
        stdio: ['inherit', 'ignore', 'ignore']
    });
    
    console.log('✅ Success!');
} catch (e) {
    console.error('❌ Failed:', e.message);
} finally {
    try { fs.unlinkSync(tmpFile); } catch(e) {}
}
