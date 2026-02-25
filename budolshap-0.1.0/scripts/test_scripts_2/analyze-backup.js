const fs = require('fs');
const path = require('path');

const backupFile = 'backups/backup-2025-12-09T10-57-15.json';
try {
    const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    console.log(`Analyzing Backup: ${backupFile}`);
    console.log(`Timestamp: ${data.timestamp}`);
    console.log('Record Counts:');
    if (data.tables) {
        Object.entries(data.tables).forEach(([table, records]) => {
            console.log(` - ${table}: ${Array.isArray(records) ? records.length : 0}`);
        });
    } else {
        console.log('No tables found in backup.');
    }
} catch (e) {
    console.error('Error reading backup:', e.message);
}
