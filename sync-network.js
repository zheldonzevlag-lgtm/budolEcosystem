const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// 1. Detect Current Local IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    let bestIP = 'localhost';

    console.log('\x1b[33m[Network Sync]\x1b[0m Checking network interfaces...');

    for (const name of Object.keys(interfaces)) {
        // Skip virtual adapters
        const isVirtual = name.toLowerCase().includes('virtual') || 
                         name.toLowerCase().includes('vethernet') || 
                         name.toLowerCase().includes('pseudo') ||
                         name.toLowerCase().includes('docker') ||
                         name.toLowerCase().includes('vbox');
        
        if (isVirtual) continue;

        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`\x1b[33m[Network Sync]\x1b[0m Found IP: ${iface.address} on ${name}`);
                
                // Never use 0.0.0.0 as the current IP
                if (iface.address === '0.0.0.0') continue;

                // Priority: 192.168.x.x (typical home/office LAN)
                if (iface.address.startsWith('192.168.')) {
                    return iface.address;
                }
                // Secondary: 10.x.x.x or 172.16.x.x
                if (iface.address.startsWith('10.') || iface.address.startsWith('172.')) {
                    bestIP = iface.address;
                }
            }
        }
    }
    return bestIP;
}

const currentIP = getLocalIP();
console.log(`\x1b[36m[Network Sync]\x1b[0m Detected IP: \x1b[32m${currentIP}\x1b[0m`);

// 2. Update .env files
const envFiles = [
    {
        path: path.join(__dirname, 'budolshap-0.1.0', '.env'),
        updates: {
            'BUDOLPAY_GATEWAY_URL': `http://${currentIP}:8000`,
            'NEXT_PUBLIC_SSO_URL': `http://${currentIP}:8000`,
            'NEXT_PUBLIC_APP_URL': `http://${currentIP}:3001`
        }
    },
    {
        path: path.join(__dirname, 'budolpay-0.1.0', 'apps', 'admin', '.env'),
        updates: {
            'SSO_URL': `http://${currentIP}:8000`,
            'NEXT_PUBLIC_SSO_URL': `http://${currentIP}:8000`,
            'NEXT_PUBLIC_APP_URL': `http://${currentIP}:3000`
        }
    }
];

envFiles.forEach(file => {
    let content = '';
    if (fs.existsSync(file.path)) {
        content = fs.readFileSync(file.path, 'utf8');
    }
    
    Object.entries(file.updates).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (regex.test(content)) {
            content = content.replace(regex, `${key}="${value}"`);
        } else {
            content += (content ? '\n' : '') + `${key}="${value}"`;
        }
    });
    
    fs.writeFileSync(file.path, content);
    console.log(`\x1b[36m[Network Sync]\x1b[0m Updated ${path.basename(path.dirname(file.path))}/.env`);
});

// 3. Update Database Redirect URIs via a temporary Prisma script
const updateDbScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('Updating budolPay (bp_key_2025)...');
    await prisma.ecosystemApp.upsert({
        where: { apiKey: 'bp_key_2025' },
        update: { redirectUri: 'http://${currentIP}:3000/api/auth/callback' },
        create: { 
            name: 'budolPay',
            apiKey: 'bp_key_2025',
            apiSecret: '919b87819befc1986e658a90d123d9ab73afbc6a4db09c1311a40a72b786fc74',
            redirectUri: 'http://${currentIP}:3000/api/auth/callback'
        }
    });

    console.log('Updating budolShap (bs_key_2025)...');
    await prisma.ecosystemApp.upsert({
        where: { apiKey: 'bs_key_2025' },
        update: { redirectUri: 'http://${currentIP}:3001/api/auth/sso/callback' },
        create: { 
            name: 'budolShap',
            apiKey: 'bs_key_2025',
            apiSecret: '9d4293e50e7a0f716c2ffd8d02a42c603bfc8b4fc0fd12430b6195be0328e72b',
            redirectUri: 'http://${currentIP}:3001/api/auth/sso/callback'
        }
    });

    console.log('Database Redirect URIs updated to ${currentIP}');
}
main().catch(console.error).finally(() => prisma.$disconnect());
`;

const tempScriptPath = path.join(__dirname, 'budolID-0.1.0', 'temp-update-ip.js');
fs.writeFileSync(tempScriptPath, updateDbScript);

try {
    console.log(`\x1b[36m[Network Sync]\x1b[0m Updating budolID Database...`);
    execSync('node temp-update-ip.js', { cwd: path.join(__dirname, 'budolID-0.1.0'), stdio: 'inherit' });
    fs.unlinkSync(tempScriptPath);
} catch (error) {
    console.error(`\x1b[31m[Network Sync] Error updating database:\x1b[0m`, error.message);
}

console.log(`\x1b[32m[Network Sync] Complete! Ecosystem is now configured for ${currentIP}\x1b[0m`);
console.log(`\x1b[33m[Important]\x1b[0m Do NOT use http://0.0.0.0:3000 in your browser.`);
console.log(`\x1b[36m[Access URLs]\x1b[0m`);
console.log(`- Local:   http://localhost:3000`);
console.log(`- Network: http://${currentIP}:3000`);
console.log(`\x1b[33m[Tip]\x1b[0m If you want to use localhost, just run this script while on your main machine.`);
