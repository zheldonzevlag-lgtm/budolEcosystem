import { PrismaClient } from '@prisma/client-custom-v4';
import { configureDatabaseEnv, getDatabaseInfo, isProduction } from './db-config.js'

// Configure database environment before creating Prisma Client
// Only run on server-side (not during client-side bundling)
if (typeof window === 'undefined') {
    configureDatabaseEnv()
    
    // Safety Check: Prevent development from connecting to production
    const PRODUCTION_DB_KEYWORDS = [
        'db.prisma.io',
        'supabase.co',
        'elephantsql.com',
        'aws.com',
        'google.com',
        'rds.amazonaws.com'
    ];
    
    const isProd = isProduction();
    const databaseUrl = process.env.DATABASE_URL || '';
    
    if (!isProd) {
        const isConnectingToProd = PRODUCTION_DB_KEYWORDS.some(keyword => databaseUrl.includes(keyword));
        if (isConnectingToProd) {
            console.error('\n❌ [budolShap] SAFETY CRITICAL ERROR:');
            console.error('   The app is running in DEVELOPMENT mode but is attempting to connect to a PRODUCTION database!');
            console.error(`   DATABASE_URL: ${databaseUrl.substring(0, 30)}...`);
            console.error('\n   ACTION REQUIRED:');
            console.error('   Run "npm run db:local" in the project root to switch to local configuration.\n');
            // In Next.js, we don't always want to process.exit(1) here as it might be during build
            // but for safety, we should at least throw an error that stops the initialization
            throw new Error('Safety check failed: Development app connecting to Production database');
        }
    }
}

const globalForPrisma = globalThis

// Use a version-specific key to force reload of Prisma Client when this file changes
const prismaKey = 'prisma_v330'

export const prisma = globalForPrisma[prismaKey] || new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma[prismaKey] = prisma

    // Log database info in development
    const dbInfo = getDatabaseInfo()
    console.log(`📊 Database: ${dbInfo.actualProvider} (${dbInfo.environment})`)
    if (dbInfo.actualProvider !== dbInfo.provider) {
        console.log(`   Prisma Provider: ${dbInfo.provider}`)
    }
}
