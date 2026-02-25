const jwt = require('jsonwebtoken');
const JWT_SECRET = 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';
const adminUserId = '37322f51-a688-4baf-8376-67521c783659';

const token = jwt.sign({ 
    userId: adminUserId,
    email: 'galvezjon59@gmail.com',
    role: 'ADMIN'
}, JWT_SECRET, { expiresIn: '7d' });

console.log(token);
