require('dotenv').config({ path: '.env' });

console.log('\n📋 Your DIRECT_URL:\n');
console.log(process.env.DIRECT_URL);
console.log('\n✅ Copy this value and add it to Vercel as DIRECT_URL environment variable');
