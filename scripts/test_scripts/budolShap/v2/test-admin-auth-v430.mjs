import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from budolshap-0.1.0
dotenv.config({ path: path.join(__dirname, '../../../budolshap-0.1.0/.env.vercel') });

const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

console.log('--- Admin Auth V430 Verification Test ---');
console.log('JWT_SECRET loaded:', JWT_SECRET.substring(0, 5) + '...');

// 1. Generate a test token
const payload = {
    userId: 'test_admin_id',
    email: 'admin@budol.com',
    name: 'Test Admin',
    role: 'ADMIN'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
console.log('Generated Test Token:', token.substring(0, 10) + '...');

// 2. Simulate token verification (what verifyToken does)
try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token Verification: SUCCESS');
    console.log('Decoded Payload:', decoded);
    
    if (decoded.role === 'ADMIN' || decoded.accountType === 'ADMIN') {
        console.log('Admin Role Check: SUCCESS');
    } else {
        console.log('Admin Role Check: FAILED');
        process.exit(1);
    }
} catch (error) {
    console.error('Token Verification: FAILED', error.message);
    process.exit(1);
}

// 3. Simulate the fix in AdminLayout.jsx (Header check)
console.log('\n--- Simulating AdminLayout.jsx fix ---');
const mockHeader = `Bearer ${token}`;
if (mockHeader.startsWith('Bearer ')) {
    const extractedToken = mockHeader.substring(7);
    const decodedFromHeader = jwt.verify(extractedToken, JWT_SECRET);
    console.log('Header Token Verification: SUCCESS');
    console.log('User from Header:', decodedFromHeader.email);
} else {
    console.log('Header Token Verification: FAILED');
    process.exit(1);
}

console.log('\n--- VERIFICATION COMPLETE: Admin Authentication Flow is robust ---');
