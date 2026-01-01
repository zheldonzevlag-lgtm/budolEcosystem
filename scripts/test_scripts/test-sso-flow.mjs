import fetch from 'node-fetch';
import chalk from 'chalk';

const BUDOLID_URL = 'http://localhost:8000';
const BUDOLPAY_ADMIN_URL = 'http://localhost:3000';
const BUDOLSHAP_URL = 'http://localhost:3001';

async function testSSO() {
    console.log(chalk.blue('🚀 Starting Ecosystem SSO Integration Test...'));

    // 1. Check if services are up
    try {
        const idHealth = await fetch(`${BUDOLID_URL}/auth/verify`).catch(() => ({ ok: false }));
        const payHealth = await fetch(`${BUDOLPAY_ADMIN_URL}/api/users`).catch(() => ({ ok: false }));
        
        console.log(chalk.yellow('Checking service availability...'));
        console.log(`- budolID: ${idHealth.status === 401 ? chalk.green('UP') : chalk.red('DOWN')}`);
        console.log(`- budolPay Admin: ${payHealth.status === 307 || payHealth.status === 200 ? chalk.green('UP') : chalk.red('DOWN')}`);
    } catch (e) {
        console.log(chalk.red('Error checking health. Ensure services are running.'));
    }

    // 2. Test budolID Token Generation
    console.log(chalk.yellow('\nTesting budolID Token Generation...'));
    const loginRes = await fetch(`${BUDOLID_URL}/auth/sso/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@budolpay.com',
            password: 'admin123',
            apiKey: 'bp_key_2025'
        })
    });

    const loginData = await loginRes.json();
    if (loginData.token) {
        console.log(chalk.green('✓ Token generated successfully'));
        console.log(chalk.gray(`  Token: ${loginData.token.substring(0, 20)}...`));
    } else {
        console.error(chalk.red('✗ Failed to generate token'), loginData);
        process.exit(1);
    }

    // 3. Test Token Verification
    console.log(chalk.yellow('\nTesting Token Verification...'));
    const verifyRes = await fetch(`${BUDOLID_URL}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    const verifyData = await verifyRes.json();
    if (verifyData.valid) {
        console.log(chalk.green('✓ Token verified by budolID'));
        console.log(chalk.gray(`  User: ${verifyData.user.email} (${verifyData.user.role})`));
    } else {
        console.error(chalk.red('✗ Token verification failed'));
        process.exit(1);
    }

    // 4. Test budolPay Admin Callback Simulation
    console.log(chalk.yellow('\nTesting budolPay Admin SSO Callback...'));
    const callbackPayUrl = `${BUDOLPAY_ADMIN_URL}/api/auth/callback?token=${loginData.token}`;
    const callbackPayRes = await fetch(callbackPayUrl, { redirect: 'manual' });
    
    if (callbackPayRes.status === 307 || callbackPayRes.status === 302) {
        const location = callbackPayRes.headers.get('location');
        const cookies = callbackPayRes.headers.get('set-cookie');
        
        if (location === '/' || location === `${BUDOLPAY_ADMIN_URL}/`) {
            console.log(chalk.green('✓ Callback redirected to dashboard'));
        } else {
            console.warn(chalk.yellow(`! Callback redirected to unexpected location: ${location}`));
        }

        if (cookies && cookies.includes('token=')) {
            console.log(chalk.green('✓ Session cookie set successfully'));
        } else {
            console.error(chalk.red('✗ Session cookie NOT set'));
        }
    } else {
        console.error(chalk.red(`✗ Callback failed with status ${callbackPayRes.status}`));
    }

    // 5. Test budolShap Callback Simulation
    console.log(chalk.yellow('\nTesting budolShap SSO Callback...'));
    const loginShapRes = await fetch(`${BUDOLID_URL}/auth/sso/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@budolpay.com',
            password: 'admin123',
            apiKey: 'bs_key_2025'
        })
    });
    const loginShapData = await loginShapRes.json();

    const callbackShapUrl = `${BUDOLSHAP_URL}/api/auth/sso/callback?token=${loginShapData.token}`;
    const callbackShapRes = await fetch(callbackShapUrl, { redirect: 'manual' });
    
    if (callbackShapRes.status === 307 || callbackShapRes.status === 302) {
        const location = callbackShapRes.headers.get('location');
        const cookies = callbackShapRes.headers.get('set-cookie');
        
        if (location === '/' || location === `${BUDOLSHAP_URL}/` || location.includes('0.0.0.0:3001')) {
            console.log(chalk.green('✓ Callback redirected to dashboard'));
        } else {
            console.warn(chalk.yellow(`! Callback redirected to unexpected location: ${location}`));
        }

        if (cookies && cookies.includes('token=')) {
            console.log(chalk.green('✓ Session cookie set successfully'));
        } else {
            console.error(chalk.red('✗ Session cookie NOT set'));
        }
    } else {
        console.error(chalk.red(`✗ Callback failed with status ${callbackShapRes.status}`));
    }

    console.log(chalk.blue('\n✨ SSO Flow Validation Complete.'));
}

testSSO().catch(err => {
    console.error(chalk.red('Test execution failed:'), err);
});
