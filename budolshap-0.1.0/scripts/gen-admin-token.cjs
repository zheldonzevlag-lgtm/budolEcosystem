require('dotenv').config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const adminUserId = '37322f51-a688-4baf-8376-67521c783659';

const token = jwt.sign({ 
    userId: adminUserId,
    email: 'galvezjon59@gmail.com',
    role: 'ADMIN'
}, JWT_SECRET, { expiresIn: '7d' });

console.log(token);
