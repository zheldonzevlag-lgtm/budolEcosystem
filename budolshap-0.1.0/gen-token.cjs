require('dotenv').config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const payload = {
    userId: '8b23b71b-c27e-4964-a15a-ead0b563ea8d',
    email: 'reynaldomgalvez@gmail.com',
    name: 'Reynaldo Galvez',
    role: 'ADMIN'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
console.log(token);
