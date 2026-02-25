const dotenv = require('dotenv');
const result = dotenv.config();
console.log('Dotenv result:', result.error ? 'Error' : 'Success');
console.log('Parsed keys:', Object.keys(result.parsed || {}));
const keys = Object.keys(process.env).filter(k => k.includes('JWT') || k.includes('APP'));
console.log('Filtered keys:', keys);
for (const key of keys) {
    console.log(`${key}: ${process.env[key]}`);
}
