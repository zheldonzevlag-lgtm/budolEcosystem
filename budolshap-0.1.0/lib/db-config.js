export function isProduction() {
    return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

/**
 * Gets the database provider based on environment
 */
export function getDatabaseProvider() {
    // Detect provider from DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL || '';
    if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
        return 'postgresql';
    } else if (databaseUrl.startsWith('mysql://')) {
        return 'mysql';
    }
    
    // Fallback to environment-based default
    return isProduction() ? 'postgresql' : 'postgresql'; // Default to postgresql for this project
}

/**
 * Configures environment variables for the appropriate database
 * This should be called before Prisma Client is initialized
 */
export function configureDatabaseEnv() {
    const isProductionEnv = isProduction();

    if (isProductionEnv) {
        // Production: Use Vercel Postgres
        console.log('🔵 Using PostgreSQL (Production/Vercel)');

        // Vercel Postgres provides these variables
        if (!process.env.DATABASE_URL && process.env.POSTGRES_PRISMA_URL) {
            process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
        }

        if (!process.env.DIRECT_URL && process.env.POSTGRES_URL_NON_POOLING) {
            process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING;
        }

        // Fallback to POSTGRES_URL if DIRECT_URL is not set
        if (!process.env.DIRECT_URL && process.env.POSTGRES_URL) {
            process.env.DIRECT_URL = process.env.POSTGRES_URL;
        }
    } else {
        // Local Development: Use local database (PostgreSQL or MySQL via adapter)
        console.log('🟢 Using Database (Local Development)');

        // For local development, DATABASE_URL and DIRECT_URL should be set in .env
        if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
            process.env.DIRECT_URL = process.env.DATABASE_URL;
        }
    }

    // Validate required environment variables
    if (!process.env.DATABASE_URL) {
        throw new Error(
            `❌ DATABASE_URL is not set!\n` +
            `For local development, set it in .env:\n` +
            `  - For PostgreSQL: DATABASE_URL="postgresql://user:password@localhost:5432/budolshap"\n` +
            `  - For MySQL (via Vercel): DATABASE_URL="mysql://root:@localhost:3306/budolshap"\n\n` +
            `For production, ensure Vercel Postgres is configured.`
        );
    }

    if (!process.env.DIRECT_URL) {
        console.warn('⚠️  DIRECT_URL not set, using DATABASE_URL as fallback');
        process.env.DIRECT_URL = process.env.DATABASE_URL;
    }
}

/**
 * Gets database connection info for logging/debugging
 */
export function getDatabaseInfo() {
    const provider = getDatabaseProvider();
    const isProductionEnv = isProduction();
    const databaseUrl = process.env.DATABASE_URL || '';

    // Detect actual database type from connection string
    let actualProvider = 'unknown';
    if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
        actualProvider = 'postgresql';
    } else if (databaseUrl.startsWith('mysql://')) {
        actualProvider = 'mysql';
    }

    return {
        provider,
        actualProvider,
        environment: isProductionEnv ? 'production' : 'development',
        isProduction: isProductionEnv,
        hasDirectUrl: !!process.env.DIRECT_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
    };
}
