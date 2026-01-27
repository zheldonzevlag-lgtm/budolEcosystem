// Test Lalamove API Connection
require('dotenv').config({ path: '.env.local' });
const Lalamove = require('../../services/lalamove');

async function testLalamoveConnection() {
    console.log('🚀 Testing Lalamove API Connection...\n');

    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('   LALAMOVE_CLIENT_ID:', process.env.LALAMOVE_CLIENT_ID ? '✅ Set' : '❌ Missing');
    console.log('   LALAMOVE_CLIENT_SECRET:', process.env.LALAMOVE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
    console.log('   LALAMOVE_ENV:', process.env.LALAMOVE_ENV || 'sandbox');
    console.log('');

    // Test authentication
    try {
        const lalamove = new Lalamove();
        console.log('🔐 Testing HMAC Authentication...');

        const result = await lalamove.testConnection();

        if (result.success) {
            console.log('✅ Authentication Successful!');
            console.log('   API Key:', process.env.LALAMOVE_CLIENT_ID.substring(0, 20) + '...');
            console.log('   Environment:', process.env.LALAMOVE_ENV || 'sandbox');
            console.log('   Base URL:', lalamove.baseUrl);
            console.log('');
            console.log('🎉 Lalamove API is ready to use!');
            console.log('');
            console.log('Next Steps:');
            console.log('   1. ✅ Phase 1 Complete - Core Architecture');
            console.log('   2. 🚀 Ready for Phase 2 - Backend API Endpoints');
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('❌ Authentication Failed!');
        console.error('   Error:', error.message);
        console.error('');
        console.error('Troubleshooting:');
        console.error('   - Check if your API keys are correct');
        console.error('   - Verify you\'re using test/sandbox credentials');
        console.error('   - Make sure there are no extra spaces in .env.local');
    }
}

testLalamoveConnection();
