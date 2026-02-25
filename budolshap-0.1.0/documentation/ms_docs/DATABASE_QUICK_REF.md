# 🗄️ Database Configuration - Quick Reference

## Automatic Database Switching

Budolshap automatically uses the correct database based on your environment:

| Environment | Database | Configuration |
|-------------|----------|---------------|
| **Local Development** | MySQL | Set in `.env` file |
| **Production (Vercel)** | PostgreSQL | Provided by Vercel |

**No manual switching required!** The app detects the environment automatically.

---

## 🟢 Local Development (MySQL)

### Quick Setup

1. **Run the setup helper**:
   ```bash
   npm run setup:local
   ```

2. **Create the database**:
   ```sql
   CREATE DATABASE budolshap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

4. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```

5. **Start development**:
   ```bash
   npm run dev
   ```

### Required Environment Variables

In your `.env` file:

```bash
DATABASE_PROVIDER=mysql
DATABASE_URL=mysql://root:@localhost:3306/budolshap
DIRECT_URL=mysql://root:@localhost:3306/budolshap
```

---

## 🔵 Production (Vercel PostgreSQL)

### Quick Setup

1. **Add Vercel Postgres**:
   - Vercel Dashboard → Storage → Create Database → Postgres

2. **Set DATABASE_PROVIDER**:
   - Vercel Dashboard → Settings → Environment Variables
   - Add: `DATABASE_PROVIDER` = `postgresql`

3. **Deploy**:
   ```bash
   git push
   ```

Vercel automatically provides:
- `POSTGRES_PRISMA_URL` (mapped to `DATABASE_URL`)
- `POSTGRES_URL_NON_POOLING` (mapped to `DIRECT_URL`)

---

## 📚 Detailed Documentation

- **[DATABASE_CONFIG_GUIDE.md](./DATABASE_CONFIG_GUIDE.md)** - Complete setup guide
- **[VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)** - Vercel environment variables
- **[.env.example](./.env.example)** - Environment variable template
- **[.env.local.example](./.env.local.example)** - Local development template

---

## 🔍 Verification

### Check Local Setup

```bash
npm run setup:local
```

You should see:
```
✅ .env file found
✅ Database configuration looks good!
✅ Using MySQL (correct for local development)
```

### Check Running App

When you run `npm run dev`, you should see:
```
🟢 Using MySQL (Local Development)
📊 Database: mysql (development)
```

---

## ⚠️ Common Issues

### "DATABASE_URL is not set"

**Solution**: Create a `.env` file with the MySQL connection string:
```bash
DATABASE_URL=mysql://root:@localhost:3306/budolshap
```

### "Can't connect to MySQL server"

**Solution**: 
1. Start WAMP/MySQL
2. Verify MySQL is running on port 3306
3. Check database exists: `SHOW DATABASES;`

### "Prisma schema mismatch"

**Solution**:
```bash
npm run prisma:generate
npm run prisma:migrate
```

---

## 🚀 Quick Commands

```bash
# Setup local environment
npm run setup:local

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# View database in browser
npm run prisma:studio

# Start development server
npm run dev
```

---

## 📖 Need More Help?

See the complete guides:
- [DATABASE_CONFIG_GUIDE.md](./DATABASE_CONFIG_GUIDE.md)
- [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)
