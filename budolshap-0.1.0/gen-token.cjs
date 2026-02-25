const jwt = require('jsonwebtoken');
const JWT_SECRET = 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

const payload = {
    userId: '8b23b71b-c27e-4964-a15a-ead0b563ea8d',
    email: 'reynaldomgalvez@gmail.com',
    name: 'Reynaldo Galvez',
    role: 'ADMIN'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
console.log(token);
