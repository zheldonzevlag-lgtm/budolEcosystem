require('dotenv').config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const userToken = jwt.sign({ 
  userId: 'user-123', 
  role: 'USER', 
  type: 'MOBILE' 
}, JWT_SECRET, { expiresIn: '1h' });

const adminToken = jwt.sign({ 
  userId: 'admin-456', 
  role: 'ADMIN', 
  type: 'WEB' 
}, JWT_SECRET, { expiresIn: '1h' });

console.log('USER_TOKEN:', userToken);
console.log('ADMIN_TOKEN:', adminToken);
