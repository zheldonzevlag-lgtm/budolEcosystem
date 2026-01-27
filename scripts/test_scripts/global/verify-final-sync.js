const fs = require('fs');
const path = require('path');

const EXPECTED_SECRET = "GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=";
const filesToCheck = [
    'budolID-0.1.0/.env',
    'budolshap-0.1.0/.env',
    'budolpay-0.1.0/.env',
    'budolpay-0.1.0/docker-compose.yml',
    '.env'
];

console.log('--- Verifying JWT_SECRET Sync ---');
filesToCheck.forEach(file => {
    const fullPath = path.resolve(__dirname, file);
    if (!fs.existsSync(fullPath)) {
        console.log(`❌ ${file}: File not found`);
        return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const match = content.match(/JWT_SECRET=["']?([^"'\n]+)["']?/);
    
    if (match) {
        const secret = match[1];
        if (secret === EXPECTED_SECRET) {
            console.log(`✅ ${file}: Matched`);
        } else {
            console.log(`❌ ${file}: Mismatch! Found: ${secret}`);
        }
    } else {
        console.log(`⚠️ ${file}: JWT_SECRET not found in file`);
    }
});
