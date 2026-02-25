
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const targetEnv = process.argv[2]; // 'local', 'prod', or 'vercel'

if (!targetEnv || !['local', 'prod', 'vercel'].includes(targetEnv)) {
    console.error('❌ Usage: node scripts/env-manager.js [local|prod|vercel]');
    process.exit(1);
}

const rootDir = path.join(__dirname, '..');
const envLocalPath = path.join(rootDir, '.env.local');
const envVercelPath = path.join(rootDir, '.env.vercel');

let sourceEnvPath;
if (targetEnv === 'vercel') {
    sourceEnvPath = envVercelPath;
} else {
    sourceEnvPath = path.join(rootDir, `.env.connection.${targetEnv}`);
}

console.log(`🔄 Switching to ${targetEnv.toUpperCase()} environment...`);

if (fs.existsSync(sourceEnvPath)) {
    try {
        // Read Source Config (DB Connection)
        const sourceContent = fs.readFileSync(sourceEnvPath, 'utf8');
        const sourceLines = sourceContent.split(/\r?\n/);

        // Read Target (.env.local) if exists, or start empty
        let targetContent = '';
        if (fs.existsSync(envLocalPath)) {
            targetContent = fs.readFileSync(envLocalPath, 'utf8');
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
                envMap.set(key, value);
            }
        });

        // Add or Remove special Vercel flags
        if (targetEnv === 'vercel') {
            envMap.set('VERCEL', '1');
            envMap.set('NEXT_PUBLIC_VERCEL_ENV', 'production');
            envMap.set('NODE_ENV', 'production');
        } else if (targetEnv === 'local') {
            envMap.delete('VERCEL');
            envMap.delete('NEXT_PUBLIC_VERCEL_ENV');
            envMap.set('NODE_ENV', 'development');
        } else if (targetEnv === 'prod') {
            envMap.delete('VERCEL');
            envMap.delete('NEXT_PUBLIC_VERCEL_ENV');
            envMap.set('NODE_ENV', 'production');
        }

        // Reconstruct File Content
        let newContent = '';
        envMap.forEach((value, key) => {
            newContent += `${key}=${value}\n`;
        });

        fs.writeFileSync(envLocalPath, newContent);
        console.log(`✅ Successfully updated .env.local with ${targetEnv} configuration (Merged)`);

        // Check what DB URL is being used
        const dbUrlMatch = newContent.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
        if (dbUrlMatch) {
            console.log(`🔗 Database URL: ${dbUrlMatch[1].substring(0, 30)}...`);
        }

    } catch (error) {
        console.error('❌ Error updating .env.local:', error);
        process.exit(1);
    }
} else {
    console.error(`❌ Source file not found: ${sourceEnvPath}`);
    console.log('   Please check if the file exists.');
    process.exit(1);
}
