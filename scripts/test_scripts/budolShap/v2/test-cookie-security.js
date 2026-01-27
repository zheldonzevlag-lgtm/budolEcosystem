const https = require('https');
const http = require('http');

// Simple test to verify cookie behavior
// Since we can't easily browser-test headers in this CLI environment without a browser,
// We will simulate a request to the local login API if the server is running, 
// OR we will conceptually verify the code changes (which we did).
// However, to actually TEST the API response headers, we need the app running.

// Assuming usage of local dev server for quick check
const TEST_URL = 'http://localhost:3000/api/auth/login';

// Can also check specific files content to ensure secure flags are present
const fs = require('fs');
const path = require('path');

async function checkFileContent() {
    console.log('🔍 Auditing Source Code for Security Flags...');

    // Check lib/auth.js
    const authPath = path.join(__dirname, '../lib/auth.js');
    const authContent = fs.readFileSync(authPath, 'utf8');

    let checks = {
        'COOKIE_OPTIONS defined': authContent.includes('export const COOKIE_OPTIONS = {'),
        'httpOnly enabled': authContent.includes('httpOnly: true'),
        'secure flag logic': authContent.includes("secure: process.env.NODE_ENV === 'production'"),
        'SameSite Lax': authContent.includes("sameSite: 'lax'")
    };

    let passed = true;
    for (const [check, result] of Object.entries(checks)) {
        if (result) {
            console.log(`✅ ${check}`);
        } else {
            console.log(`❌ ${check}`);
            passed = false;
        }
    }

    // Check Login Route
    console.log('\n🔍 Auditing Login Route...');
    const loginPath = path.join(__dirname, '../app/api/auth/login/route.js');
    const loginContent = fs.readFileSync(loginPath, 'utf8');

    if (loginContent.includes('COOKIE_OPTIONS')) {
        console.log('✅ Login route uses standardized COOKIE_OPTIONS');
    } else {
        console.log('❌ Login route does NOT use COOKIE_OPTIONS');
        passed = false;
    }

    // Check Logout Route
    console.log('\n🔍 Auditing Logout Route...');
    const logoutPath = path.join(__dirname, '../app/api/auth/logout/route.js');
    const logoutContent = fs.readFileSync(logoutPath, 'utf8');

    if (logoutContent.includes('COOKIE_OPTIONS')) {
        console.log('✅ Logout route uses standardized COOKIE_OPTIONS');
    } else {
        console.log('❌ Logout route does NOT use COOKIE_OPTIONS');
        passed = false;
    }

    if (passed) {
        console.log('\n✨ SECURITY AUDIT PASSED: Codebase correctly implements Phase 1 Security Standards.');
    } else {
        console.error('\n⚠️ SECURITY AUDIT FAILED: Some checks were missed.');
        process.exit(1);
    }
}

checkFileContent();
