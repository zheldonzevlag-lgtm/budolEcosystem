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
    const rootDir = path.resolve(__dirname, '../../..');
    
    // Recursive function to find all .env files
    function findEnvFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                // Skip node_modules and .git
                if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
                    findEnvFiles(filePath, fileList);
                }
            } else if (file === '.env' || file === '.env.local' || file === '.env.development') {
                fileList.push(filePath);
            }
        });
        return fileList;
    }

    const envFiles = findEnvFiles(rootDir);

    envFiles.forEach(envPath => {
        let content = fs.readFileSync(envPath, 'utf8');
        let modified = false;
        
        // 1. Update LOCAL_IP
        if (content.match(/^LOCAL_IP=.*/m)) {
            const currentIp = content.match(/^LOCAL_IP=(.*)/m)[1];
            if (currentIp !== localIP) {
                content = content.replace(/^LOCAL_IP=.*/m, `LOCAL_IP=${localIP}`);
                modified = true;
            }
        } else {
            content += `\nLOCAL_IP=${localIP}`;
            modified = true;
        }

        // 2. Update common URL patterns that use IPs
        // Matches http://192.168.x.x:port or http://localhost:port or http://127.0.0.1:port
        const ipRegex = /http:\/\/(?:localhost|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)/g;
        const newContent = content.replace(ipRegex, `http://${localIP}$1`);
        if (newContent !== content) {
            content = newContent;
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(envPath, content);
            console.log(`[Network] Updated ${path.relative(rootDir, envPath)} with IP: ${localIP}`);
        }
    });

    // Update Mobile App config if it exists
    const mobileConfigPath = path.join(rootDir, 'budolPayMobile', 'lib', 'services', 'api_service.dart');
    if (fs.existsSync(mobileConfigPath)) {
        let content = fs.readFileSync(mobileConfigPath, 'utf8');
        // Update defaultValue: '192.168.1.x'
        const dartIpRegex = /defaultValue:\s+'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}'/g;
        content = content.replace(dartIpRegex, `defaultValue: '${localIP}'`);
        fs.writeFileSync(mobileConfigPath, content);
        console.log(`[Network] Updated Mobile App API Host in api_service.dart`);
    }

    return localIP;
}

module.exports = { getLocalIP, updateNetworkConfig };

// Execute if run directly
if (require.main === module) {
    updateNetworkConfig();
}

