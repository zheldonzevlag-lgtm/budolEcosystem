require('dotenv').config({ path: '.env' });

console.log('🔍 Checking DATABASE_URL...\n');

const dbUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (dbUrl) {
    console.log('DATABASE_URL found');
    console.log('Length:', dbUrl.length);
    console.log('Starts with:', dbUrl.substring(0, 30) + '...');

    // Check for special characters that need escaping
    const hasSpecialChars = /[!@#$%^&*()+=\[\]{}|\\:;"'<>,.?/]/.test(dbUrl);
    console.log('Has special characters:', hasSpecialChars);
} else {
    console.log('❌ DATABASE_URL not found in .env');
}

console.log('\n');

if (directUrl) {
    console.log('DIRECT_URL found');
    console.log('Length:', directUrl.length);
    console.log('Starts with:', directUrl.substring(0, 30) + '...');
} else {
    console.log('❌ DIRECT_URL not found in .env');
}

// Check if we have the db2 versions
console.log('\n📋 Checking for db2 variables:');
console.log('db2_DATABASE_URL:', process.env.db2_DATABASE_URL ? '✅ Found' : '❌ Not found');
console.log('db2_POSTGRES_URL:', process.env.db2_POSTGRES_URL ? '✅ Found' : '❌ Not found');
console.log('db2_PRISMA_DATABASE_URL:', process.env.db2_PRISMA_DATABASE_URL ? '✅ Found' : '❌ Not found');

console.log('\n💡 Suggestion: Use db2_PRISMA_DATABASE_URL as DATABASE_URL');
console.log('💡 Suggestion: Use db2_POSTGRES_URL as DIRECT_URL');
