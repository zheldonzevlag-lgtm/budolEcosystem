
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PG_DUMP_PATH = 'D:\\PostgreSQL\\18\\bin\\pg_dump.exe';
const BACKUP_DIR = path.join(__dirname, 'backups', new Date().toISOString().replace(/[:.]/g, '-'));

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const DATABASES = [
    { name: 'budolshap_1db', url: 'postgresql://postgres:r00t@localhost:5432/budolshap_1db' },
    { name: 'budolpay', url: 'postgresql://postgres:r00t@localhost:5432/budolpay' }
];

async function backup() {
    console.log('Starting SQL backups...');
    
    for (const db of DATABASES) {
        const outputFile = path.join(BACKUP_DIR, `${db.name}.sql`);
        console.log(`Backing up ${db.name} to ${outputFile}...`);
        
        try {
            // Extract connection details from URL
            const url = new URL(db.url);
            const host = url.hostname;
            const port = url.port;
            const user = url.username;
            const password = url.password;
            const database = url.pathname.substring(1);

            process.env.PGPASSWORD = password;
            
            const command = `"${PG_DUMP_PATH}" -h ${host} -p ${port} -U ${user} -d ${database} -f "${outputFile}" --no-owner --no-acl --clean --if-exists`;
            
            execSync(command, { stdio: 'inherit' });
            console.log(`Successfully backed up ${db.name}`);
        } catch (error) {
            console.error(`Failed to back up ${db.name}:`, error.message);
        }
    }
    
    delete process.env.PGPASSWORD;
    console.log(`Backups completed. Location: ${BACKUP_DIR}`);
}

backup();
