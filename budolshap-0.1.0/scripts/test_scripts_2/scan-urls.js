
const fs = require('fs');
const path = require('path');

const filename = process.argv[2] || '../.env.check_prod';
const envPath = path.isAbsolute(filename) ? filename : path.join(__dirname, '..', filename);
console.log('Reading:', envPath);

if (!fs.existsSync(envPath)) {
    console.error('File not found!');
    process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');

const vars = {};
lines.forEach(line => {
    const match = line.match(/^([A-Z_]+)="?([^"]+)"?$/);
    if (match) {
        vars[match[1]] = match[2];
    }
});

console.log('--- FOUND URLS ---');
console.log('DATABASE_URL:', vars.DATABASE_URL || 'NOT SET');
console.log('POSTGRES_URL:', vars.POSTGRES_URL || 'NOT SET');
console.log('POSTGRES_PRISMA_URL:', vars.POSTGRES_PRISMA_URL || 'NOT SET');
console.log('DIRECT_URL:', vars.DIRECT_URL || 'NOT SET');

// Identify which one is DIFFERENT from c0999
const c0999 = 'c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc';

function check(name, url) {
    if (!url) return;
    if (url.includes(c0999)) {
        console.log(`[${name}] matches c0999 (Empty DB)`);
    } else {
        console.log(`[${name}] IS DIFFERENT! -> POTENTIALLY RICH DB`);
    }
}

check('DATABASE_URL', vars.DATABASE_URL);
check('POSTGRES_URL', vars.POSTGRES_URL);
check('POSTGRES_PRISMA_URL', vars.POSTGRES_PRISMA_URL);
check('DIRECT_URL', vars.DIRECT_URL);
