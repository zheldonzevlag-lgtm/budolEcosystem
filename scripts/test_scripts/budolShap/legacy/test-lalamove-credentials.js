// Test script to verify Lalamove credentials
require('dotenv').config();

console.log('🔍 Testing Lalamove Configuration...\n');

// Check environment variables
const requiredEnvVars = [
  'LALAMOVE_CLIENT_ID',
  'LALAMOVE_CLIENT_SECRET', 
  'LALAMOVE_ENV',
  'LALAMOVE_WEBHOOK_SECRET'
];

console.log('📋 Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ Present' : '❌ Missing';
  const maskedValue = value ? `${value.substring(0, 10)}...` : 'N/A';
  console.log(`  ${varName}: ${status} (${maskedValue})`);
});

// Test the shipping factory
console.log('\n🏭 Testing Shipping Factory...');
try {
  const { getShippingProvider } = require('../../services/shippingFactory');
  const lalamove = getShippingProvider('lalamove');
  console.log('✅ Shipping factory working');
  console.log('✅ Lalamove provider initialized');
} catch (error) {
  console.error('❌ Shipping factory error:', error.message);
}

console.log('\n✨ Test complete!');