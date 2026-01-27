const fs = require('fs');
const path = require('path');

const rootDir = 'd:/IT Projects/budolEcosystem';
const dirs = [
    rootDir,
    path.join(rootDir, 'budolID-0.1.0'),
    path.join(rootDir, 'budolshap-0.1.0'),
    path.join(rootDir, 'budolpay-0.1.0'),
    path.join(rootDir, 'budolpay-0.1.0', 'services', 'auth-service'),
    path.join(rootDir, 'budolpay-0.1.0', 'services', 'wallet-service'),
    path.join(rootDir, 'budolpay-0.1.0', 'services', 'transaction-service'),
    path.join(rootDir, 'budolpay-0.1.0', 'services', 'payment-gateway-service'),
    path.join(rootDir, 'budolpay-0.1.0', 'services', 'api-gateway'),
    path.join(rootDir, 'budolpay-0.1.0', 'services', 'verification-service'),
    path.join(rootDir, 'budolAccounting-0.1.0')
];

dirs.forEach(dir => {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/^LOCAL_IP=(.*)/m);
        console.log(`${path.relative(rootDir, envPath)}: ${match ? match[1] : 'NOT FOUND'}`);
    } else {
        console.log(`${path.relative(rootDir, envPath)}: MISSING`);
    }
});
