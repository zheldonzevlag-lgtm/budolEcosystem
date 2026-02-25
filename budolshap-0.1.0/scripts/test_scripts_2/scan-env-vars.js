const fs = require('fs');
const path = require('path');

// Collect all environment variables used in the codebase
const envVars = new Set();

function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const regex = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            envVars.add(match[1]);
        }
    } catch (e) {
        // Skip files that can't be read
    }
}

function scanDirectory(dir, excludeDirs = ['node_modules', '.next', '.git', 'dist', 'build']) {
    try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (!excludeDirs.includes(item)) {
                    scanDirectory(fullPath, excludeDirs);
                }
            } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx') || item.endsWith('.ts') || item.endsWith('.tsx'))) {
                scanFile(fullPath);
            }
        }
    } catch (e) {
        // Skip directories that can't be read
    }
}

console.log('🔍 Scanning codebase for environment variables...\n');
scanDirectory(process.cwd());

// Categorize environment variables
const categories = {
    'Authentication & Security': [],
    'Database': [],
    'Lalamove API': [],
    'Email/SMTP': [],
    'Payment (PayMongo)': [],
    'Cloudinary': [],
    'App Configuration': [],
    'Other': []
};

envVars.forEach(varName => {
    if (varName.includes('JWT') || varName.includes('SECRET') || varName.includes('AUTH')) {
        categories['Authentication & Security'].push(varName);
    } else if (varName.includes('DATABASE') || varName.includes('POSTGRES') || varName.includes('PRISMA')) {
        categories['Database'].push(varName);
    } else if (varName.includes('LALAMOVE')) {
        categories['Lalamove API'].push(varName);
    } else if (varName.includes('SMTP') || varName.includes('EMAIL') || varName.includes('MAIL')) {
        categories['Email/SMTP'].push(varName);
    } else if (varName.includes('PAYMONGO') || varName.includes('PAYMENT') || varName.includes('STRIPE')) {
        categories['Payment (PayMongo)'].push(varName);
    } else if (varName.includes('CLOUDINARY')) {
        categories['Cloudinary'].push(varName);
    } else if (varName.includes('APP_URL') || varName.includes('BASE_URL') || varName.includes('NODE_ENV') || varName.includes('PORT')) {
        categories['App Configuration'].push(varName);
    } else {
        categories['Other'].push(varName);
    }
});

console.log('📋 Environment Variables Found:\n');
console.log('='.repeat(80));

for (const [category, vars] of Object.entries(categories)) {
    if (vars.length > 0) {
        console.log(`\n${category}:`);
        console.log('-'.repeat(80));
        vars.sort().forEach(v => console.log(`  ${v}`));
    }
}

console.log('\n' + '='.repeat(80));
console.log(`\nTotal: ${envVars.size} unique environment variables\n`);

// Generate .env.example template
const envExample = [];
envExample.push('# ========================================');
envExample.push('# Environment Variables Template');
envExample.push('# Copy this to .env and fill in your values');
envExample.push('# ========================================\n');

for (const [category, vars] of Object.entries(categories)) {
    if (vars.length > 0) {
        envExample.push(`# ${category}`);
        vars.sort().forEach(v => {
            envExample.push(`${v}=`);
        });
        envExample.push('');
    }
}

fs.writeFileSync('.env.example', envExample.join('\n'));
console.log('✅ Generated .env.example template\n');
