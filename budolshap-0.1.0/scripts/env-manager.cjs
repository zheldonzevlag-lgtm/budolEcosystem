
const fs = require('fs');
const path = require('path');

const targetEnv = process.argv[2]; // 'local', 'prod', or 'vercel'

if (!targetEnv || !['local', 'prod', 'vercel'].includes(targetEnv)) {
    console.error('❌ Usage: node scripts/env-manager.js [local|prod|vercel]');
    process.exit(1);
}

const rootDir = path.join(__dirname, '..');
const ecosystemRoot = path.join(rootDir, '..');

const envPaths = [
    path.join(rootDir, '.env'),
    path.join(rootDir, 'packages', 'database', '.env'),
    path.join(rootDir, 'apps', 'admin', '.env'),
    path.join(rootDir, 'services', 'api-gateway', '.env'),
    path.join(rootDir, 'services', 'wallet-service', '.env'),
    path.join(rootDir, 'services', 'auth-service', '.env'),
    path.join(rootDir, 'services', 'transaction-service', '.env'),
    path.join(rootDir, 'services', 'verification-service', '.env'),
    path.join(rootDir, 'services', 'payment-gateway-service', '.env'),
    // Ecosystem wide services
    path.join(ecosystemRoot, 'budolID-0.1.0', '.env'),
    path.join(ecosystemRoot, 'budolshap-0.1.0', '.env'),
    path.join(ecosystemRoot, 'budolAccounting-0.1.0', '.env'),
    path.join(ecosystemRoot, '.env')
];
const envVercelPath = path.join(rootDir, '.env.vercel');

let sourceEnvPath;
if (targetEnv === 'vercel') {
    sourceEnvPath = envVercelPath;
} else {
    sourceEnvPath = path.join(rootDir, `.env.connection.${targetEnv}`);
}

console.log(`🔄 Switching BudolPay to ${targetEnv.toUpperCase()} environment...`);

if (fs.existsSync(sourceEnvPath)) {
    try {
        // Read Source Config (DB Connection)
        const sourceContent = fs.readFileSync(sourceEnvPath, 'utf8');
        const sourceLines = sourceContent.split(/\r?\n/);

        envPaths.forEach(envPath => {
            // Check if the directory exists before attempting to write
            const dir = path.dirname(envPath);
            if (!fs.existsSync(dir)) {
                // If it's a service/app/package that doesn't exist in this project structure, skip it
                return;
            }

            // Read Target (.env) if exists, or start empty
            let targetContent = '';
            if (fs.existsSync(envPath)) {
                targetContent = fs.readFileSync(envPath, 'utf8');
            }

            // Parse Target into a Map
            const envMap = new Map();
            targetContent.split(/\r?\n/).forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim();
                    envMap.set(key, value);
                }
            });

            // Update Map with Source values
            sourceLines.forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim();
                    
                    // Service-aware mapping for DATABASE_URL
                    if (key === 'BUDOLID_DATABASE_URL' && envPath.includes('budolID-0.1.0')) {
                        envMap.set('DATABASE_URL', value);
                    } else if (key === 'BUDOLSHAP_DATABASE_URL' && envPath.includes('budolshap-0.1.0')) {
                        envMap.set('DATABASE_URL', value);
                    } else if (key === 'BUDOLACCOUNTING_DATABASE_URL' && envPath.includes('budolAccounting-0.1.0')) {
                        envMap.set('DATABASE_URL', value);
                    } else if (key === 'DATABASE_URL' && !envPath.includes('budolID') && !envPath.includes('budolshap') && !envPath.includes('budolAccounting')) {
                        // Default DATABASE_URL for budolpay services
                        envMap.set('DATABASE_URL', value);
                    } else if (key.startsWith('BUDOL') && key.endsWith('_DATABASE_URL')) {
                        // Keep service-specific URLs in the map but don't map to DATABASE_URL for other services
                        envMap.set(key, value);
                    } else {
                        // Map all other variables as is
                        envMap.set(key, value);
                    }
                }
            });

            // Add or Remove special Vercel flags
            if (targetEnv === 'vercel') {
                envMap.set('VERCEL', '1');
                envMap.set('NODE_ENV', 'production');
            } else if (targetEnv === 'local') {
                envMap.delete('VERCEL');
                envMap.set('NODE_ENV', 'development');
            } else if (targetEnv === 'prod') {
                envMap.delete('VERCEL');
                envMap.set('NODE_ENV', 'production');
            }

            // Reconstruct File Content
            let newContent = '';
            envMap.forEach((value, key) => {
                newContent += `${key}=${value}\n`;
            });

            fs.writeFileSync(envPath, newContent);
            console.log(`✅ Successfully updated ${path.relative(rootDir, envPath)} with ${targetEnv} configuration`);

            // Check what DB URL is being used (only for first file to avoid log spam)
            if (envPath === envPaths[0]) {
                const dbUrlMatch = newContent.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
                if (dbUrlMatch) {
                    console.log(`🔗 Database URL: ${dbUrlMatch[1].substring(0, 30)}...`);
                }
            }
        });

    } catch (error) {
        console.error('❌ Error updating .env:', error);
        process.exit(1);
    }
} else {
    console.error(`❌ Source file not found: ${sourceEnvPath}`);
    console.log('   Please create it with DATABASE_URL for the environment.');
    process.exit(1);
}
