const fs = require('fs');
const { execSync } = require('child_process');

const envFile = fs.readFileSync('.env.test', 'utf8');
const lines = envFile.split('\n');

for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    
    // We match key="value" or key=value
    const match = line.match(/^([^=]+)="(.*)"$/) || line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    
    const key = match[1];
    let value = match[2];
    
    // Clean up the string completely
    // It looks like ""value" \r\n" right now
    value = value.replace(/\\r\\n/g, '').trim();
    // If it starts and ends with quotes, remove them
    if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
    }
    
    console.log(`Fixing ${key} to be: [${value}]`);
    
    try {
        execSync(`npx vercel env rm ${key} production -y`, { stdio: 'inherit' });
    } catch (e) {}
    
    try {
        execSync(`npx vercel env add ${key} production`, { input: value, stdio: ['pipe', 'inherit', 'inherit'] });
    } catch (e) {
        console.log(`Failed to add ${key}`);
    }
}
console.log('Done!');
