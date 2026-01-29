
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load budolID .env
const budolIDEnv = dotenv.parse(fs.readFileSync(path.join(__dirname, '../../budolID-0.1.0/.env')));
const budolIDSecret = budolIDEnv.JWT_SECRET || 'budolid-super-secret-key';

// Load budolShap .env
const budolShapEnv = dotenv.parse(fs.readFileSync(path.join(__dirname, '../../budolshap-0.1.0/.env')));
const budolShapSecret = budolShapEnv.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

console.log('--- JWT Secret Verification ---');
console.log('budolID Secret:', budolIDSecret);
console.log('budolShap Secret:', budolShapSecret);

if (budolIDSecret === budolShapSecret) {
    console.log('✅ Secrets match!');
} else {
    console.log('❌ Secrets DO NOT match!');
}

const payload = { sub: 'test-user-123', email: 'test@example.com' };

console.log('\n--- Cross-Service Token Verification Test ---');

// 1. budolID signs, budolShap verifies
const tokenFromID = jwt.sign(payload, budolIDSecret);
try {
    jwt.verify(tokenFromID, budolShapSecret);
    console.log('✅ budolShap verified token signed by budolID');
} catch (e) {
    console.log('❌ budolShap FAILED to verify token signed by budolID:', e.message);
}

// 2. budolShap signs, budolID verifies
const tokenFromShap = jwt.sign(payload, budolShapSecret);
try {
    jwt.verify(tokenFromShap, budolIDSecret);
    console.log('✅ budolID verified token signed by budolShap');
} catch (e) {
    console.log('❌ budolID FAILED to verify token signed by budolShap:', e.message);
}
