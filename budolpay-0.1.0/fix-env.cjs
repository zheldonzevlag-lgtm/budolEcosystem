const fs = require('fs');
const { execSync } = require('child_process');

const envFile = fs.readFileSync('.env.vercel.prod', 'utf8');
const lines = envFile.split('\n');

for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    
    // Some lines look like: CLOUDINARY_API_KEY="537684148625265\r\n"
    // We want to extract the key and the actual value, stripping literal \r\n and quotes
    const match = line.match(/^([^=]+)="(.*)"$/);
    if (!match) continue;
    
    const key = match[1];
    let value = match[2];
    
    if (value.endsWith('\\r\\n')) {
        value = value.slice(0, -4);
        console.log(`Fixing ${key} to be: ${value}`);
        
        try {
            // Remove old var
            execSync(`npx vercel env rm ${key} production -y`, { stdio: 'inherit' });
        } catch (e) {
            console.log(`Failed to remove ${key}`);
        }
        
        try {
            // Add new var
            execSync(`echo "${value}" | npx vercel env add ${key} production`, { stdio: 'inherit' });
        } catch (e) {
            console.log(`Failed to add ${key}`);
        }
    }
}
console.log('Done!');
