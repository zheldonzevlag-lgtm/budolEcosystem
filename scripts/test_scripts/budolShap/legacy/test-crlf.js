const crypto = require('crypto');

const apiSecret = 'test_secret';
const timestamp = '1234567890';
const method = 'GET';
const path = '/v3/cities';
const body = '';

// Test 1: Escaped backslashes (WRONG)
const wrong = `${timestamp}\\r\\n${method}\\r\\n${path}\\r\\n\\r\\n${body}`;
console.log('Wrong (escaped):', JSON.stringify(wrong));
console.log('Length:', wrong.length);

// Test 2: Actual CRLF (CORRECT)
const correct = timestamp + '\r\n' + method + '\r\n' + path + '\r\n\r\n' + body;
console.log('Correct (actual CRLF):', JSON.stringify(correct));
console.log('Length:', correct.length);

const sig1 = crypto.createHmac('sha256', apiSecret).update(wrong).digest('hex');
const sig2 = crypto.createHmac('sha256', apiSecret).update(correct).digest('hex');

console.log('Signature with escaped:', sig1);
console.log('Signature with actual CRLF:', sig2);
console.log('Are they equal?', sig1 === sig2);
