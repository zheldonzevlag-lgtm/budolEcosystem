/**
 * Generate and set CRON_SECRET for Vercel
 * This script generates a secure random secret and provides instructions to set it in Vercel
 */

const crypto = require('crypto')

// Generate a secure random secret
const cronSecret = crypto.randomBytes(32).toString('hex')

console.log('🔐 CRON_SECRET Generated!')
console.log('='.repeat(80))
console.log('\n📋 Your CRON_SECRET:')
console.log(`\n   ${cronSecret}\n`)
console.log('='.repeat(80))

console.log('\n📝 Instructions to set in Vercel:')
console.log('\n1. Go to: https://vercel.com/derflanoj2s-projects/budolshap/settings/environment-variables')
console.log('\n2. Click "Add New" button')
console.log('\n3. Fill in:')
console.log('   - Name: CRON_SECRET')
console.log(`   - Value: ${cronSecret}`)
console.log('   - Environment: Production, Preview, Development (select all)')
console.log('\n4. Click "Save"')
console.log('\n5. Redeploy your application for changes to take effect')

console.log('\n' + '='.repeat(80))
console.log('\n✅ This secret will protect your cron endpoint from unauthorized access')
console.log('✅ Vercel will automatically include this in cron job requests')
console.log('\n💡 Save this secret securely - you\'ll need it for testing!\n')
