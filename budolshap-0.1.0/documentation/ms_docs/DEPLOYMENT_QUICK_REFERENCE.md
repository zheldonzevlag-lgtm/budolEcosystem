# 🚀 Quick Deployment Reference

## One-Command Deployment

### Windows (PowerShell)
```powershell
.\scripts\deploy.ps1 -Production
```

### Linux/Mac (Bash)
```bash
chmod +x scripts/deploy.sh && ./scripts/deploy.sh --production
```

---

## Manual Deployment (5 Steps)

```bash
# 1. Login
vercel login

# 2. Link project
vercel link

# 3. Pull environment variables
vercel env pull .env.production

# 4. Run migrations
npx dotenv -e .env.production -- npx prisma migrate deploy

# 5. Deploy
vercel --prod
```

---

## Essential Commands

| Command | Description |
|---------|-------------|
| `vercel` | Deploy to preview |
| `vercel --prod` | Deploy to production |
| `vercel logs` | View deployment logs |
| `vercel env pull` | Pull environment variables |
| `vercel rollback` | Rollback to previous deployment |
| `vercel open` | Open project in browser |

---

## Pre-Deployment Checklist

- [ ] All environment variables set in Vercel Dashboard
- [ ] Database created in Vercel Storage
- [ ] Code committed to Git
- [ ] Local build test passed (`npm run build`)
- [ ] Migrations ready (`npx prisma migrate status`)

---

## Required Environment Variables

### Critical (Must Set)
```
DATABASE_PROVIDER=postgresql
JWT_SECRET=<random-64-char-string>
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

### Third-Party Services
```
# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# PayMongo (LIVE keys!)
PAYMONGO_SECRET_KEY=sk_live_...
PAYMONGO_PUBLIC_KEY=pk_live_...
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_live_...

# Lalamove (Production!)
LALAMOVE_API_KEY=
LALAMOVE_API_SECRET=
LALAMOVE_ENVIRONMENT=production

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=
```

---

## Troubleshooting Quick Fixes

### Build Failed
```bash
npm install
npx prisma generate
npm run build
```

### Database Connection Error
```bash
vercel env ls
vercel env pull .env.production
```

### Migration Failed
```bash
npx dotenv -e .env.production -- npx prisma db push
```

### Deployment Failed
```bash
vercel logs
# Fix issues, then:
vercel --prod
```

---

## Post-Deployment Tests

1. **Homepage:** https://your-app.vercel.app
2. **Login:** Test user authentication
3. **Products:** Browse product listings
4. **Cart:** Add items and checkout
5. **Admin:** Access admin panel
6. **Payment:** Test PayMongo integration
7. **Delivery:** Test Lalamove booking

---

## Emergency Rollback

### Option 1: Vercel Dashboard
1. Go to Deployments
2. Find previous working deployment
3. Click "Promote to Production"

### Option 2: CLI
```bash
vercel rollback
```

### Option 3: Git
```bash
git revert HEAD
git push origin main
```

---

## Support Links

- **Vercel Dashboard:** https://vercel.com/derflanoj2s-projects/budolshap
- **Environment Variables:** https://vercel.com/derflanoj2s-projects/budolshap/settings/environment-variables
- **Database:** https://vercel.com/derflanoj2s-projects/budolshap/stores
- **Logs:** `vercel logs` or Dashboard → Deployments
- **Full Guide:** See `DEPLOYMENT_GUIDE.md`

---

## Script Options

### PowerShell (`deploy.ps1`)
```powershell
# Production deployment
.\scripts\deploy.ps1 -Production

# Skip checks
.\scripts\deploy.ps1 -Production -SkipChecks

# Skip migration
.\scripts\deploy.ps1 -Production -SkipMigration

# Quick deploy (skip everything)
.\scripts\deploy.ps1 -Production -SkipChecks -SkipMigration
```

### Bash (`deploy.sh`)
```bash
# Production deployment
./scripts/deploy.sh --production

# Skip checks
./scripts/deploy.sh --production --skip-checks

# Skip migration
./scripts/deploy.sh --production --skip-migration
```

---

## Database Commands

```bash
# View database in browser
npx prisma studio

# Check migration status
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy

# Reset database (⚠️ DELETES ALL DATA!)
npx prisma migrate reset

# Push schema changes
npx prisma db push

# Generate Prisma client
npx prisma generate
```

---

## Monitoring

### Check Usage
- Vercel Dashboard → Usage
- Monitor bandwidth, function execution, database

### View Analytics
- Vercel Dashboard → Analytics
- Check page load times, traffic

### Database Health
- Vercel Dashboard → Storage → Your Database
- Monitor size, connections, queries

---

## Free Tier Limits

| Resource | Limit |
|----------|-------|
| Bandwidth | 100 GB/month |
| Function Execution | 100 GB-hours |
| Database Storage | 256 MB |
| Database Compute | 60 hours/month |
| Concurrent Builds | 1 |

**Upgrade:** https://vercel.com/pricing

---

**Last Updated:** 2025-11-30  
**Quick Help:** See `DEPLOYMENT_GUIDE.md` for detailed instructions
