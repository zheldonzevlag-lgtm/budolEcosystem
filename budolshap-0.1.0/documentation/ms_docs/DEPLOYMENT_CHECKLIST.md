# 🚀 Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Database Setup
- [x] Created Vercel Postgres database (`budolshap-db`)
- [x] Connected database to project
- [ ] Added `DATABASE_URL` environment variable (from Postgres quickstart line 3)
- [ ] Added `DIRECT_URL` environment variable (from Postgres quickstart line 2)

### 2. Required Environment Variables
Add these in **Vercel Dashboard → Settings → Environment Variables**:

- [ ] `DATABASE_URL` = `prisma+postgres://...` (from Vercel Postgres)
- [ ] `DIRECT_URL` = `postgres://...` (from Vercel Postgres)
- [ ] `JWT_SECRET` = `GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=`
- [ ] `NEXT_PUBLIC_APP_URL` = `https://budolshap.vercel.app`
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://budolshap.vercel.app`
- [ ] `NEXT_PUBLIC_BASE_URL` = `https://budolshap.vercel.app`
- [ ] `NEXT_PUBLIC_CURRENCY_SYMBOL` = `₱`

### 3. Optional Environment Variables (if needed)
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (for email)
- [ ] `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET` (for GCash payments)
- [ ] `ADMIN_EMAILS` (for admin access)

### 4. Code Changes
- [x] Updated `package.json` build script to include migrations
- [x] Prisma schema configured for PostgreSQL

---

## 🎯 Deployment Steps

### Option A: Automated Script (Recommended)
```powershell
.\deploy-vercel.ps1
```

### Option B: Manual Steps
```powershell
# 1. Login to Vercel
vercel login

# 2. Link project
vercel link

# 3. Pull environment variables
vercel env pull .env.production

# 4. Run migration
npx dotenv -e .env.production -- npx prisma migrate deploy

# 5. Deploy
vercel --prod
```

### Option C: Git Push (if connected to GitHub)
```bash
git add .
git commit -m "Configure for Vercel Postgres deployment"
git push
```
*Vercel will automatically build and deploy*

---

## 📋 Post-Deployment

- [ ] Check deployment logs for errors
- [ ] Verify database tables were created (Vercel Dashboard → Storage → budolshap-db)
- [ ] Test the application at `https://budolshap.vercel.app`
- [ ] Create admin user (optional)
- [ ] Test key features:
  - [ ] User registration/login
  - [ ] Product browsing
  - [ ] Cart functionality
  - [ ] Order placement
  - [ ] Admin dashboard

---

## 🔧 Troubleshooting

### If migration fails:
1. Check `DATABASE_URL` and `DIRECT_URL` are correctly set
2. View deployment logs in Vercel Dashboard
3. Try running migration manually: `npx dotenv -e .env.production -- npx prisma migrate deploy`

### If build fails:
1. Check all required environment variables are set
2. Verify Prisma schema is valid
3. Check deployment logs for specific errors

### If app doesn't work:
1. Check browser console for errors
2. Verify all `NEXT_PUBLIC_*` variables are set
3. Check Vercel function logs

---

## 📚 Useful Links

- **Vercel Dashboard**: https://vercel.com/derflanoj2s-projects/budolshap
- **Deployment Guide**: See `VERCEL_MIGRATION_GUIDE.md`
- **Prisma Documentation**: https://www.prisma.io/docs
- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres

---

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ Database migrations run successfully
- ✅ Application loads at your Vercel URL
- ✅ You can register/login
- ✅ Products display correctly
- ✅ Orders can be placed

---

**Current Status**: Ready to add environment variables and deploy!
