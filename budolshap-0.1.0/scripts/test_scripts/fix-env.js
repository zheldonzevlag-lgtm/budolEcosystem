const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.production');

try {
    let content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    let dbUrl = '';
    let hasDirectUrl = false;

    for (const line of lines) {
        if (line.startsWith('DATABASE_URL=')) {
            dbUrl = line.substring('DATABASE_URL='.length).trim();
            // Remove quotes if present
            if (dbUrl.startsWith('"') && dbUrl.endsWith('"')) {
                dbUrl = dbUrl.slice(1, -1);
            }
        }
        if (line.startsWith('DIRECT_URL=')) {
            hasDirectUrl = true;
        }
    }

    if (!dbUrl) {
        console.error('DATABASE_URL not found in .env.production');
        process.exit(1);
    }

    if (!hasDirectUrl) {
        // Remove empty DIRECT_URL lines if any
        content = content.replace(/^DIRECT_URL=.*$/gm, '');
        // Append
        const newContent = content.trim() + `\nDIRECT_URL="${dbUrl}"`;
        fs.writeFileSync(envPath, newContent);
        console.log('Fixed: Added DIRECT_URL from DATABASE_URL');
    } else {
        // Check if it's empty
        const directUrlMatch = content.match(/^DIRECT_URL=(.*)$/m);
        if (directUrlMatch && !directUrlMatch[1].trim()) {
            content = content.replace(/^DIRECT_URL=.*$/m, `DIRECT_URL="${dbUrl}"`);
            fs.writeFileSync(envPath, content);
            console.log('Fixed: Populated empty DIRECT_URL');
        } else {
            console.log('DIRECT_URL appears valid');
        }
    }

} catch (err) {
    console.error(err);
}
