# Database Configuration Guide

## Overview

Budolshap now automatically switches between databases based on the environment:

- **Local Development**: MySQL (via WAMP)
- **Production (Vercel)**: PostgreSQL (Vercel Postgres)

No manual configuration needed! The app detects the environment and uses the correct database automatically.

---

## 🟢 Local Development Setup (MySQL)

### Prerequisites
1. WAMP/XAMPP/MAMP installed and running
2. MySQL service started
3. Database created: `budolshap`

### Environment Variables

Create a `.env` file in the root directory with:

```bash
# Database Configuration
DATABASE_PROVIDER=mysql
DATABASE_URL=mysql://root:@localhost:3306/budolshap
DIRECT_URL=mysql://root:@localhost:3306/budolshap

# Other required variables
JWT_SECRET=your-secret-key
NEXT_PUBLIC_CURRENCY_SYMBOL=₱
```

### Setup Steps

1. **Create the database**:
   ```sql
   CREATE DATABASE budolshap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

3. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

You should see:
```
🟢 Using MySQL (Local Development)
📊 Database: mysql (development)
```

---

## 🔵 Production Setup (Vercel PostgreSQL)

### Prerequisites
1. Vercel account
2. Project deployed to Vercel

### Setup Steps

1. **Add Vercel Postgres to your project**:
   - Go to your Vercel project dashboard
   - Navigate to "Storage" tab
   - Click "Create Database"
   - Select "Postgres"
   - Click "Create"

2. **Vercel automatically sets these environment variables**:
   - `POSTGRES_PRISMA_URL` - Connection string for Prisma
   - `POSTGRES_URL_NON_POOLING` - Direct connection (for migrations)
   - `POSTGRES_URL` - Pooled connection

3. **Set DATABASE_PROVIDER**:
   In Vercel project settings → Environment Variables, add:
   ```
   DATABASE_PROVIDER=postgresql
   ```

4. **Deploy your application**:
   ```bash
   git push
   ```
   
   Vercel will automatically:
   - Detect the PostgreSQL database
   - Run `prisma generate`
   - Build your application

5. **Run migrations** (one-time):
   In Vercel project settings, add a build command override or run manually:
   ```bash
   npx prisma migrate deploy
   ```

---

## 🔄 How It Works

### Automatic Detection

The `lib/db-config.js` utility automatically detects the environment:

```javascript
// Checks if running in production
function isProduction() {
    return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

// Returns the appropriate database provider
function getDatabaseProvider() {
    return isProduction() ? 'postgresql' : 'mysql';
}
```

### Environment Variable Mapping

**Local Development (MySQL)**:
- `DATABASE_URL` → MySQL connection string
- `DIRECT_URL` → Same as DATABASE_URL

**Production (Vercel PostgreSQL)**:
- `DATABASE_URL` ← `POSTGRES_PRISMA_URL` (auto-mapped)
- `DIRECT_URL` ← `POSTGRES_URL_NON_POOLING` (auto-mapped)

---

## 🛠️ Troubleshooting

### Local Development Issues

**Error: Can't connect to MySQL server**
```bash
# Check if MySQL is running
# In WAMP: Click WAMP icon → MySQL → Service → Start/Restart

# Verify connection
mysql -u root -p
```

**Error: Database doesn't exist**
```sql
CREATE DATABASE budolshap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Error: DATABASE_URL not set**
```bash
# Make sure .env file exists with:
DATABASE_URL=mysql://root:@localhost:3306/budolshap
```

### Production Issues

**Error: Can't connect to database**
- Verify Vercel Postgres is added to your project
- Check that `DATABASE_PROVIDER=postgresql` is set in Vercel environment variables
- Ensure migrations have been run: `npx prisma migrate deploy`

**Error: Prisma schema mismatch**
```bash
# Regenerate Prisma Client
npx prisma generate

# Redeploy
git commit --allow-empty -m "Regenerate Prisma Client"
git push
```

---

## 📝 Migration Guide

### From MySQL-only to Multi-Database

If you're migrating from a MySQL-only setup:

1. **Backup your local database**:
   ```bash
   npm run db:backup
   ```

2. **Update your `.env`**:
   ```bash
   DATABASE_PROVIDER=mysql
   DATABASE_URL=mysql://root:@localhost:3306/budolshap
   DIRECT_URL=mysql://root:@localhost:3306/budolshap
   ```

3. **Regenerate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

4. **Test locally**:
   ```bash
   npm run dev
   ```

### From PostgreSQL-only to Multi-Database

If you're migrating from a PostgreSQL-only setup:

1. **For local development**, install MySQL and create database
2. **Update `.env`** as shown above
3. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```

---

## 🎯 Best Practices

### Local Development
- Always use MySQL for local development to match the original setup
- Keep your `.env` file in `.gitignore`
- Use `npm run prisma:studio` to view/edit data

### Production
- Let Vercel manage PostgreSQL credentials
- Never commit production credentials
- Use Vercel's environment variable management
- Run migrations via Vercel CLI or build hooks

### Database Migrations
- Test migrations locally first (MySQL)
- Then deploy to production (PostgreSQL)
- Prisma handles SQL differences automatically

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [MySQL Documentation](https://dev.mysql.com/doc/)

---

## 🆘 Need Help?

If you encounter issues:

1. Check the console logs for database connection messages
2. Verify environment variables are set correctly
3. Ensure the database service is running
4. Check Prisma schema matches your database

For local development:
```bash
# View current database info
npx prisma studio

# Check connection
npx prisma db pull
```

For production:
```bash
# Check Vercel environment variables
vercel env ls

# View deployment logs
vercel logs
```
