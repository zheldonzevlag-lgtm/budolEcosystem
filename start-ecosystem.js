const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { Bonjour } = require('bonjour-service');
const { updateNetworkConfig } = require('./scripts/test_scripts/global/network-util');
const { validateEnvironment } = require('./scripts/test_scripts/global/env-validator');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function start() {
    console.log('\x1b[1m\x1b[33m%s\x1b[0m', '🚀 budolEcosystem Central Runner');
    console.log('--------------------------------------------------');
    
    console.log('Choose Target Environment:');
    console.log('1. \x1b[32mLOCAL\x1b[0m (Local databases, local network)');
    console.log('2. \x1b[31mPRODUCTION / VERCEL\x1b[0m (Cloud databases, remote environment)');
    console.log('3. \x1b[33mSKIP\x1b[0m (Keep current .env files)');
    
    // Strictly mandatory selection loop
    let choice = process.env.RUN_ENV || '';
    if (!choice) {
        while (!['1', '2', '3'].includes(choice)) {
            choice = (await askQuestion('\nEnter choice (1, 2, or 3): ')).trim();
            if (!['1', '2', '3'].includes(choice)) {
                console.log('\x1b[31mInvalid choice. Please enter 1, 2, or 3.\x1b[0m');
            }
        }
    } else {
        console.log(`\nUsing environment choice: ${choice}`);
    }
    
    let envType = '';
    if (choice === '1') {
        console.log('\n🔄 \x1b[32mSwitching to LOCAL environment...\x1b[0m');
        try {
            execSync('npm run db:local', { stdio: 'inherit' });
            envType = 'local';
        } catch (e) {
            console.error('❌ Failed to switch to local environment');
        }
    } else if (choice === '2') {
        console.log('\n🔄 \x1b[31mSwitching to PRODUCTION/VERCEL environment...\x1b[0m');
        try {
            execSync('npm run db:vercel', { stdio: 'inherit' });
            envType = 'vercel';
        } catch (e) {
            console.error('❌ Failed to switch to production environment');
        }
    } else {
        console.log('\n\n⏭️  Skipping environment switch. Using current configurations.');
    }

    // Prisma Client Generation (Critical for microservices)
    console.log('\n\x1b[1m\x1b[36m%s\x1b[0m', '💎 Generating Prisma Clients...');
    try {
        execSync('npm run db:generate', { stdio: 'inherit' });
        console.log('\x1b[32m✅ Prisma Clients generated successfully.\x1b[0m');
    } catch (e) {
        console.error('\x1b[31m❌ Failed to generate Prisma Clients. Some services may fail to start.\x1b[0m');
    }

    rl.close();

    // Auto-detect network and update configuration
    const localIP = updateNetworkConfig();

    const apps = [
        {
            name: 'budolID (SSO)',
            cwd: path.join(__dirname, 'budolID-0.1.0'),
            command: 'npm',
            args: ['run', 'start'],
            port: 8000,
            color: '\x1b[35m' // Magenta
        },
        {
            name: 'budolShap (App)',
            cwd: path.join(__dirname, 'budolshap-0.1.0'),
            command: 'npm',
            args: ['run', 'dev'],
            port: 3001,
            color: '\x1b[32m' // Green
        },
        {
            name: 'budolPay (Admin)',
            cwd: path.join(__dirname, 'budolpay-0.1.0'),
            command: 'npm',
            args: ['run', 'dev', '-w', 'admin'],
            port: 3000,
            color: '\x1b[34m' // Blue
        },
        {
            name: 'budolPay (TX)',
            cwd: path.join(__dirname, 'budolpay-0.1.0', 'services', 'transaction-service'),
            command: 'node',
            args: ['index.js'],
            port: 8003,
            color: '\x1b[31m' // Red
        },
        {
            name: 'budolPay (Gateway)',
            cwd: path.join(__dirname, 'budolpay-0.1.0', 'services', 'payment-gateway-service'),
            command: 'node',
            args: ['index.js'],
            port: 8004,
            color: '\x1b[36m' // Cyan
        },
        {
            name: 'budolPay (Wallet)',
            cwd: path.join(__dirname, 'budolpay-0.1.0', 'services', 'wallet-service'),
            command: 'node',
            args: ['index.js'],
            port: 8002,
            color: '\x1b[94m' // Light Blue
        },
        {
            name: 'budolPay (Auth)',
            cwd: path.join(__dirname, 'budolpay-0.1.0', 'services', 'auth-service'),
            command: 'node',
            args: ['index.js'],
            port: 8001,
            color: '\x1b[92m' // Light Green
        },
        {
            name: 'budolPay (Gateway API)',
            cwd: path.join(__dirname, 'budolpay-0.1.0', 'services', 'api-gateway'),
            command: 'node',
            args: ['index.js'],
            port: 8080,
            color: '\x1b[95m' // Magenta
        },
        {
            name: 'budolAccounting',
            cwd: path.join(__dirname, 'budolAccounting-0.1.0'),
            command: 'npm',
            args: ['run', 'start'],
            port: 8005,
            color: '\x1b[33m' // Yellow
        },
        {
            name: 'budolPay (KYC)',
            cwd: path.join(__dirname, 'budolpay-0.1.0', 'services', 'verification-service'),
            command: 'node',
            args: ['index.js'],
            port: 8006,
            color: '\x1b[91m' // Light Red
        },
        {
            name: 'budolPay (Settlement)',
            cwd: path.join(__dirname, 'budolpay-0.1.0', 'services', 'settlement-service'),
            command: 'node',
            args: ['index.js'],
            port: 8007,
            color: '\x1b[38;5;120m' // Light Spring Green
        },
        {
            name: 'budolPay (Mobile Web)',
            cwd: path.join(__dirname, 'budolPayMobile'),
            command: 'flutter',
            args: ['run', '-d', 'web-server', '--web-hostname', '0.0.0.0', '--web-port', '9000'],
            port: 9000,
            color: '\x1b[38;5;208m' // Orange
        }
    ];

    console.log('\n\x1b[1m\x1b[33m%s\x1b[0m', '🚀 Starting budolEcosystem services...');
    console.log('\x1b[36m%s\x1b[0m', `Local IP: ${localIP}`);
    console.log('--------------------------------------------------');

    // Pre-flight check: Environment Validation
    console.log('🔍 Running Pre-flight Environment Validation...');
    let allValid = true;

    apps.forEach(app => {
        // Try to find .env in app directory
        const envPath = path.join(app.cwd, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            
            // Extract key values for validation
            const dbMatch = envContent.match(/^DATABASE_URL=["']?(.+?)["']?$/m);
            const nodeEnvMatch = envContent.match(/^NODE_ENV=["']?(.+?)["']?$/m);
            const vercelMatch = envContent.match(/^VERCEL=["']?(.+?)["']?$/m);
            const jwtMatch = envContent.match(/^JWT_SECRET=["']?(.+?)["']?$/m);
            const localIpMatch = envContent.match(/^LOCAL_IP=["']?(.+?)["']?$/m);

            if (dbMatch) {
                // DO NOT set process.env permanently. Use a temporary object or 
                // manually pass values to validateEnvironment if it supported it.
                // Since validateEnvironment uses process.env, we must swap carefully.
                
                const originalEnv = { ...process.env };

                process.env.DATABASE_URL = dbMatch[1];
                process.env.NODE_ENV = nodeEnvMatch ? nodeEnvMatch[1] : 'development';
                process.env.VERCEL = vercelMatch ? vercelMatch[1] : undefined;
                process.env.JWT_SECRET = jwtMatch ? jwtMatch[1] : undefined;
                process.env.LOCAL_IP = localIpMatch ? localIpMatch[1] : undefined;

                if (!validateEnvironment(app.name)) {
                    allValid = false;
                }

                // Restore properly
                const keysToRestore = ['DATABASE_URL', 'NODE_ENV', 'VERCEL', 'JWT_SECRET', 'LOCAL_IP'];
                keysToRestore.forEach(key => {
                    if (originalEnv[key] === undefined) {
                        delete process.env[key];
                    } else {
                        process.env[key] = originalEnv[key];
                    }
                });
            }
        }
    });

    if (!allValid) {
        console.log('\n\x1b[31m🛑 SAFETY BLOCK: Misconfiguration detected.\x1b[0m');
        console.log('\x1b[33mPlease check your .env files and try again.\x1b[0m');
        process.exit(1);
    }

    apps.forEach(app => {
        // Create a clean environment object for the child process
        // We start with a copy of process.env but REMOVE variables that
        // should be loaded from the app's own .env file.
        const cleanEnv = { ...process.env };
        
        // Remove variables that might be leaked from previous app starts or the runner itself
        const varsToRemove = ['DATABASE_URL', 'NODE_ENV', 'VERCEL', 'PORT', 'JWT_SECRET', 'LOCAL_IP'];
        varsToRemove.forEach(v => delete cleanEnv[v]);

        const env = { 
            ...cleanEnv, 
            PORT: app.port.toString(),
            LOCAL_IP: localIP,
            API_GATEWAY_URL: `http://${localIP}:8080`,
            AUTH_SERVICE_URL: `http://${localIP}:8001`,
            WALLET_SERVICE_URL: `http://${localIP}:8002`,
            TRANSACTION_SERVICE_URL: `http://${localIP}:8003`,
            PAYMENT_GATEWAY_URL: `http://${localIP}:8004`,
            ACCOUNTING_SERVICE_URL: `http://${localIP}:8005`,
            NEXT_PUBLIC_API_GATEWAY_URL: `http://${localIP}:8080`
        };
        
        const childProcess = spawn(app.command, app.args, { 
            cwd: app.cwd, 
            shell: true,
            env: env
        });

        childProcess.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    console.log(`${app.color}[${app.name}]\x1b[0m ${line.trim()}`);
                }
            });
        });

        childProcess.stderr.on('data', (data) => {
            console.error(`${app.color}[${app.name} ERROR]\x1b[0m ${data.toString().trim()}`);
        });

        childProcess.on('close', (code) => {
            console.log(`${app.color}[${app.name}]\x1b[0m exited with code ${code}`);
        });
    });

    // mDNS Service Discovery
    console.log('\n\x1b[1m\x1b[32m%s\x1b[0m', '📡 Initializing mDNS Service Discovery...');
    const bonjour = new Bonjour();
    
    apps.forEach(app => {
        // Map app names to shorter mDNS types if needed
        // Precise mDNS typing for service discovery
        let mdnsType = 'http';
        
        // The mobile app specifically looks for '_budolpay._tcp.local'
        // We only want the API Gateway (port 8080) to have this type to avoid confusion
        if (app.port === 8080) {
            mdnsType = 'budolpay';
        } else if (app.name.toLowerCase().includes('id')) {
            mdnsType = 'budolid';
        } else if (app.name.toLowerCase().includes('shap')) {
            mdnsType = 'budolshap';
        } else if (app.name.toLowerCase().includes('admin')) {
            mdnsType = 'budoladmin';
        } else if (app.name.toLowerCase().includes('gateway')) {
            mdnsType = 'budolpg'; // Payment Gateway service
        }

        try {
            const service = bonjour.publish({
                name: app.name,
                type: mdnsType,
                protocol: 'tcp',
                port: app.port,
                txt: { 
                    version: '1.0.0', 
                    env: 'local',
                    ip: localIP
                }
            });
            console.log(`\x1b[32m[mDNS]\x1b[0m Advertising: ${app.name} (${mdnsType}) on port ${app.port}`);
        } catch (err) {
            console.error(`\x1b[31m[mDNS] Error advertising ${app.name}:\x1b[0m`, err.message);
        }
    });

    console.log('--------------------------------------------------');
    console.log('\x1b[1m\x1b[32m%s\x1b[0m', '✅ All services started and advertising via mDNS!');
}

start();

process.on('SIGINT', () => {
    console.log('\n\x1b[31mStopping ecosystem...\x1b[0m');
    process.exit();
});
