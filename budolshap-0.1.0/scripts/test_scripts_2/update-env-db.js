const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');

try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    const envVars = {};

    // Parse existing env vars
    envLines.forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            envVars[match[1].trim()] = match[2].trim();
        }
    });

    // Determine the correct values from PROD_ variables
    const prodPrismaUrl = envVars['PROD_PRISMA_DATABASE_URL'];
    const prodPostgresUrl = envVars['PROD_POSTGRES_URL'];
    const prodDbUrl = envVars['PROD_DATABASE_URL'];

    let newDatabaseUrl = prodPrismaUrl || prodDbUrl;
    let newDirectUrl = prodPostgresUrl || prodDbUrl;

    // Remove quotes if present for cleaner handling (though we'll put them back if needed)
    if (newDatabaseUrl) newDatabaseUrl = newDatabaseUrl.replace(/^"|"$/g, '');
    if (newDirectUrl) newDirectUrl = newDirectUrl.replace(/^"|"$/g, '');

    if (newDatabaseUrl) {
        console.log('Found PROD database URL. Updating DATABASE_URL...');
        // Update or append DATABASE_URL
        if (envContent.includes('DATABASE_URL=')) {
            envContent = envContent.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${newDatabaseUrl}"`);
        } else {
            envContent += `\nDATABASE_URL="${newDatabaseUrl}"`;
        }
    }

    if (newDirectUrl) {
        console.log('Found PROD direct URL. Updating DIRECT_URL...');
        // Update or append DIRECT_URL
        if (envContent.includes('DIRECT_URL=')) {
            envContent = envContent.replace(/^DIRECT_URL=.*$/m, `DIRECT_URL="${newDirectUrl}"`);
        } else {
            envContent += `\nDIRECT_URL="${newDirectUrl}"`;
        }
    }

    // Ensure DATABASE_PROVIDER is postgresql
    if (envContent.includes('DATABASE_PROVIDER=')) {
        envContent = envContent.replace(/^DATABASE_PROVIDER=.*$/m, 'DATABASE_PROVIDER="postgresql"');
    } else {
        envContent += '\nDATABASE_PROVIDER="postgresql"';
    }

    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env updated successfully to use PROD database variables.');

} catch (error) {
    console.error('Error updating .env:', error);
}
