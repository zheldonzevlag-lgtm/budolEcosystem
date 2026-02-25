import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, '../prisma/migrations/0_init/migration.sql');

try {
    const buffer = fs.readFileSync(filePath);
    console.log(`File size: ${buffer.length} bytes`);
    
    let nullBytes = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === 0) {
            nullBytes++;
            if (nullBytes <= 10) {
                console.log(`Null byte found at offset ${i}`);
            }
        }
    }
    
    if (nullBytes > 0) {
        console.log(`Total null bytes found: ${nullBytes}`);
    } else {
        console.log('No null bytes found.');
    }
} catch (error) {
    console.error('Error reading file:', error);
}
