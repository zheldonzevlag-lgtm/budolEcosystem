const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = "GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=";

console.log('--- JWT Synchronization Verification ---');

// 1. Create a test token using the synchronized secret
const payload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'USER'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
console.log('Generated Test Token (first 20 chars):', token.substring(0, 20) + '...');

// 2. Verify the token using the same secret
try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Local Verification: SUCCESS');
    console.log('Decoded Payload:', JSON.stringify(decoded));
} catch (err) {
    console.error('❌ Local Verification: FAILED', err.message);
}

// 3. Check fallbacks in critical files
const filesToCheck = [
    'budolID-0.1.0/api/index.js',
    'budolshap-0.1.0/lib/token-edge.js',
    'budolpay-0.1.0/services/api-gateway/index.js',
    'budolpay-0.1.0/services/auth-service/index.js'
];

console.log('\n--- Checking Fallbacks in Code ---');

filesToCheck.forEach(file => {
    const fullPath = path.resolve(file);
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(JWT_SECRET)) {
            console.log(`✅ ${file}: Secret fallback found`);
        } else {
            console.warn(`⚠️ ${file}: Secret fallback NOT found or mismatched!`);
        }
    } else {
        console.error(`❌ ${file}: File not found at ${fullPath}`);
    }
});

// 4. Check .env files
const envFiles = [
    'budolID-0.1.0/.env',
    'budolshap-0.1.0/.env',
    'budolpay-0.1.0/.env',
    '.env'
];

console.log('\n--- Checking .env Files ---');

envFiles.forEach(file => {
    const fullPath = path.resolve(file);
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(`JWT_SECRET="${JWT_SECRET}"`)) {
            console.log(`✅ ${file}: JWT_SECRET synchronized`);
        } else if (content.includes(`JWT_SECRET='${JWT_SECRET}'`)) {
            console.log(`✅ ${file}: JWT_SECRET synchronized (single quotes)`);
        } else {
            console.warn(`⚠️ ${file}: JWT_SECRET mismatched or missing!`);
        }
    } else {
        console.error(`❌ ${file}: File not found at ${fullPath}`);
    }
});
