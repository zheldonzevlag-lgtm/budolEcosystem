const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Detects the machine's local IPv4 address on the primary network interface.
 * Filters out internal (loopback) and virtual (WSL, Docker, etc.) interfaces.
 */
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    const candidates = [];

    for (const name of Object.keys(interfaces)) {
        // Skip virtual interfaces commonly used by WSL, Docker, etc.
        if (name.includes('vEthernet') || name.includes('Virtual') || name.includes('WSL') || name.includes('Docker')) {
            continue;
        }

        for (const iface of interfaces[name]) {
            // Only IPv4, not internal (loopback)
            if (iface.family === 'IPv4' && !iface.internal) {
                candidates.push({ name, address: iface.address });
            }
        }
    }

    // Prefer interfaces that look like physical Ethernet or Wi-Fi
    const physical = candidates.find(c => 
        c.name.toLowerCase().includes('wi-fi') || 
        c.name.toLowerCase().includes('ethernet') || 
        c.name.toLowerCase().includes('wlan') ||
        c.name.toLowerCase().includes('en0')
    );

    const result = physical ? physical.address : (candidates.length > 0 ? candidates[0].address : '127.0.0.1');
    console.log(`[Network] Detected Local IP: ${result} (via ${physical ? physical.name : 'default interface'})`);
    return result;
}

/**
 * Updates all .env files in the ecosystem with the detected Local IP.
 */
function updateNetworkConfig() {
    const localIP = getLocalIP();
    const rootDir = path.resolve(__dirname, '..');
    
    // List of directories to check for .env files
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
            let content = fs.readFileSync(envPath, 'utf8');
            
            // 1. Update LOCAL_IP
            if (content.match(/^LOCAL_IP=.*/m)) {
                content = content.replace(/^LOCAL_IP=.*/m, `LOCAL_IP=${localIP}`);
            } else {
                content += `\nLOCAL_IP=${localIP}`;
            }

            // 2. Update common URL patterns that use IPs
            // Matches http://192.168.x.x:port or http://localhost:port
            const ipRegex = /http:\/\/(?:localhost|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)/g;
            content = content.replace(ipRegex, `http://${localIP}$1`);

            fs.writeFileSync(envPath, content);
            // console.log(`[Network] Updated ${path.relative(rootDir, envPath)}`);
        }
    });

    // Update Mobile App config if it exists
    const mobileConfigPath = path.join(rootDir, 'budolPayMobile', 'lib', 'services', 'api_service.dart');
    if (fs.existsSync(mobileConfigPath)) {
        let content = fs.readFileSync(mobileConfigPath, 'utf8');
        // Update defaultValue: '192.168.1.x' or 'localhost'
        const dartIpRegex = /defaultValue:\s+'(?:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|localhost)'/g;
        content = content.replace(dartIpRegex, `defaultValue: '${localIP}'`);
        fs.writeFileSync(mobileConfigPath, content);
        console.log(`[Network] Updated Mobile App API Host in api_service.dart to ${localIP}`);
    }

    // Update MOBILE_CONFIG.txt if it exists
    const mobileConfigTxtPath = path.join(rootDir, 'scripts', 'test_scripts', 'global', 'MOBILE_CONFIG.txt');
    if (fs.existsSync(mobileConfigTxtPath)) {
        let content = `
=========================================
BUDOLECOSYSTEM MOBILE CONNECTION HELPER
=========================================
Detected Server IP: ${localIP}

To connect your physical device to this server:
1. Ensure your phone is on the same Wi-Fi as this computer.
2. When building/running the Flutter app, use:
   flutter run --dart-define=API_HOST=${localIP}

Current timestamp: ${new Date().toISOString()}
=========================================
`;
        fs.writeFileSync(mobileConfigTxtPath, content);
        console.log(`[Network] Updated MOBILE_CONFIG.txt to ${localIP}`);
    }

    return localIP;
}

module.exports = { getLocalIP, updateNetworkConfig };

