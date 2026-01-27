const fs = require('fs');
const path = require('path');

const envFiles = [
    'budolID-0.1.0/.env',
    'budolshap-0.1.0/.env',
    'budolpay-0.1.0/.env',
    '.env'
];

envFiles.forEach(file => {
    const fullPath = path.resolve(file);
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const match = content.match(/JWT_SECRET=["']?([^"'\n\r]+)["']?/);
        if (match) {
            const secret = match[1];
            const hex = Buffer.from(secret).toString('hex');
            console.log(`${file}: "${secret}"`);
            console.log(`Hex: ${hex}`);
            console.log(`Length: ${secret.length}`);
        } else {
            console.log(`${file}: JWT_SECRET not found`);
        }
    } else {
        console.log(`${file}: File not found`);
    }
    console.log('---');
});
