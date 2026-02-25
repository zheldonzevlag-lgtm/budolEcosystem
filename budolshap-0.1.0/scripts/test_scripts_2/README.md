# 📜 Scripts Directory

This directory contains utility scripts for managing the BudolShap application.

## Deployment Scripts

### `deploy.ps1` (PowerShell - Windows)
Automated deployment script for Vercel with comprehensive checks and validations.

**Usage:**
```powershell
# Production deployment with all checks
.\scripts\deploy.ps1 -Production

# Skip pre-deployment checks
.\scripts\deploy.ps1 -Production -SkipChecks

# Skip database migration
.\scripts\deploy.ps1 -Production -SkipMigration

# Quick deployment (skip all)
.\scripts\deploy.ps1 -Production -SkipChecks -SkipMigration
```

**Features:**
- Pre-deployment validation
- Vercel authentication check
- Environment variable verification
- Database migration handling
- Build testing
- Git status check
- Post-deployment checklist

### `deploy.sh` (Bash - Linux/Mac)
Cross-platform deployment script with same features as PowerShell version.

**Usage:**
```bash
# Make executable
chmod +x scripts/deploy.sh

# Production deployment
./scripts/deploy.sh --production

# Skip checks
./scripts/deploy.sh --production --skip-checks

# Skip migration
./scripts/deploy.sh --production --skip-migration
```

## Database Scripts

### `backup-database.js`
Creates a backup of the current database.

**Usage:**
```bash
npm run db:backup
```

### `restore-database.js`
Restores database from a backup file.

**Usage:**
```bash
npm run db:restore
```

### `seed-test-data.js`
Seeds the database with test data for development.

**Usage:**
```bash
npm run db:seed
```

### `setup-local-db.js`
Sets up the local development database.

**Usage:**
```bash
npm run setup:local
```

## Admin Scripts

### `create-admin.js`
Creates an admin user account.

**Usage:**
```bash
npm run create-admin
```

**Interactive prompts:**
- Email
- Password
- Name

### `check-admin.js`
Checks if an admin account exists.

**Usage:**
```bash
node scripts/check-admin.js
```

## Store Scripts

### `geocode-stores.js`
Geocodes store addresses for delivery integration.

**Usage:**
```bash
node scripts/geocode-stores.js
```

### `check-store.js`
Checks store information.

**Usage:**
```bash
node scripts/check-store.js
```

## Order Scripts

### `check-both-orders.js`
Checks both regular and Lalamove orders.

**Usage:**
```bash
node scripts/check-both-orders.js
```

### `debug-order.js`
Debugs order-related issues.

**Usage:**
```bash
node scripts/debug-order.js
```

### `create_dummy_order.js`
Creates a dummy order for testing.

**Usage:**
```bash
node scripts/create_dummy_order.js
```

## Utility Scripts

### `migrate-images-to-cloudinary.js`
Migrates local images to Cloudinary.

**Usage:**
```bash
node scripts/migrate-images-to-cloudinary.js
```

### `update-env-db.js`
Updates environment database configuration.

**Usage:**
```bash
node scripts/update-env-db.js
```

### `update-production-schema.js`
Updates production database schema.

**Usage:**
```bash
node scripts/update-production-schema.js
```

## User Scripts

### `get_user_id.js`
Gets user ID by email.

**Usage:**
```bash
node scripts/get_user_id.js
```

### `get_users.js`
Lists all users.

**Usage:**
```bash
node scripts/get_users.js
```

### `create-pending-member.js`
Creates a pending member account.

**Usage:**
```bash
node scripts/create-pending-member.js
```

## Testing Scripts

### `test-memberships-api.js`
Tests the memberships API endpoints.

**Usage:**
```bash
node scripts/test-memberships-api.js
```

### `check-contact.js`
Checks contact information.

**Usage:**
```bash
node scripts/check-contact.js
```

### `check-stops.js`
Checks Lalamove delivery stops.

**Usage:**
```bash
node scripts/check-stops.js
```

## NPM Script Shortcuts

All scripts can be run using npm commands defined in `package.json`:

### Deployment
```bash
npm run deploy              # Deploy to preview
npm run deploy:prod         # Deploy to production
npm run deploy:script       # Run PowerShell deployment script
```

### Environment
```bash
npm run env:pull            # Pull environment variables from Vercel
npm run env:list            # List environment variables
```

### Database
```bash
npm run db:backup           # Backup database
npm run db:restore          # Restore database
npm run db:seed             # Seed test data
npm run setup:local         # Setup local database
```

### Prisma
```bash
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Run migrations (dev)
npm run prisma:studio       # Open Prisma Studio
npm run migrate:deploy      # Deploy migrations (production)
npm run migrate:status      # Check migration status
```

### Vercel
```bash
npm run vercel:login        # Login to Vercel
npm run vercel:link         # Link project to Vercel
npm run vercel:logs         # View deployment logs
```

### Admin
```bash
npm run create-admin        # Create admin account
```

## Best Practices

### Before Running Scripts

1. **Check your current directory:**
   ```bash
   pwd  # Linux/Mac
   cd   # Windows
   ```
   Make sure you're in the project root.

2. **Ensure dependencies are installed:**
   ```bash
   npm install
   ```

3. **Check environment variables:**
   ```bash
   # Verify .env file exists
   ls .env  # Linux/Mac
   dir .env # Windows
   ```

### Script Execution Order

For deployment:
1. `npm run db:backup` (optional, for safety)
2. `npm run prisma:generate`
3. `npm run build` (test build)
4. `npm run deploy:script` or `npm run deploy:prod`

For database setup:
1. `npm run setup:local`
2. `npm run prisma:migrate`
3. `npm run db:seed` (optional)
4. `npm run create-admin`

### Troubleshooting

**Script not found:**
```bash
# Verify script exists
ls scripts/  # Linux/Mac
dir scripts\ # Windows
```

**Permission denied (Linux/Mac):**
```bash
chmod +x scripts/deploy.sh
```

**PowerShell execution policy (Windows):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Node.js errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json  # Linux/Mac
rmdir /s node_modules && del package-lock.json  # Windows
npm install
```

## Adding New Scripts

When adding a new script:

1. **Create the script file** in `scripts/` directory
2. **Add documentation** to this README
3. **Add npm script** to `package.json` if it's commonly used
4. **Test the script** before committing
5. **Add error handling** and helpful messages

**Template for new scripts:**
```javascript
#!/usr/bin/env node

/**
 * Script Name: your-script.js
 * Description: What this script does
 * Usage: node scripts/your-script.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting script...');
    
    // Your script logic here
    
    console.log('✅ Script completed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

## Security Notes

⚠️ **Important:**
- Never commit `.env` files
- Don't hardcode sensitive data in scripts
- Use environment variables for credentials
- Review scripts before running in production
- Keep backups before running destructive operations

## Support

For issues with scripts:
1. Check this README for usage instructions
2. Review the script's source code for comments
3. Check the main `DEPLOYMENT_GUIDE.md` for deployment issues
4. Verify environment variables are set correctly

---

**Last Updated:** 2025-11-30  
**Maintained by:** BudolShap Development Team
