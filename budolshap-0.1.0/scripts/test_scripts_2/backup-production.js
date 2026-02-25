const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { spawn } = require('child_process');

console.log('🚀 Starting Production Database Backup...');

// Load .env.production
const envPath = path.resolve(__dirname, '../.env.production');
if (!fs.existsSync(envPath)) {
    console.error(`❌ Error: ${envPath} not found`);
    process.exit(1);
}

console.log(`📄 Loading environment from ${path.basename(envPath)}`);
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Prepare environment variables
// We start with process.env to keep system paths etc.
const newEnv = { ...process.env };

// Override with production variables
Object.assign(newEnv, envConfig);

// Ensure DATABASE_URL is set
if (!newEnv.DATABASE_URL) {
    if (newEnv.POSTGRES_URL) {
        console.log('⚠️ DATABASE_URL missing, using POSTGRES_URL fallback');
        newEnv.DATABASE_URL = newEnv.POSTGRES_URL;
    } else if (newEnv.DIRECT_URL) {
        newEnv.DATABASE_URL = newEnv.DIRECT_URL;
    }
}

// Ensure DIRECT_URL is set (backup script prefers it)
// Ensure DIRECT_URL is set (backup script prefers it)
if (!newEnv.DIRECT_URL && newEnv.POSTGRES_URL_NON_POOLING) {
    newEnv.DIRECT_URL = newEnv.POSTGRES_URL_NON_POOLING;
}

// Normalize protocols to postgresql:// and clean values
['DATABASE_URL', 'DIRECT_URL', 'POSTGRES_URL'].forEach(key => {
    if (newEnv[key]) {
        // Clean quotes and whitespace
        newEnv[key] = newEnv[key].replace(/^["']|["']$/g, '').trim();

        if (newEnv[key].startsWith('postgres://')) {
            newEnv[key] = newEnv[key].replace('postgres://', 'postgresql://');
        }
    }
});

console.log('🔄 Spawning backup-database.js with production environment...');
console.log('─'.repeat(50));

const child = spawn('node', ['scripts/backup-database.js'], {
    cwd: path.join(__dirname, '..'),
    env: newEnv,
    stdio: 'inherit'
});

child.on('close', (code) => {
    if (code !== 0) {
        console.error(`❌ Backup process exited with code ${code}`);
        process.exit(code);
    } else {
        console.log('✅ Backup wrapper finished successfully');
    }
});
