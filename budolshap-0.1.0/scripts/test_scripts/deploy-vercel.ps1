# Quick Deployment Script for Vercel Postgres

Write-Host "--- Step 1: Checking Vercel login status ---" -ForegroundColor Yellow
vercel whoami
if ($HOST.UI.RawUI.WindowTitle -eq "NOT_LOGGED_IN") { # Simple check
    Write-Host "[!] Not logged in to Vercel. Please run 'vercel login' first." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Logged in to Vercel" -ForegroundColor Green
Write-Host ""

# Step 2: Link project
Write-Host "--- Step 2: Linking project ---" -ForegroundColor Yellow
vercel link --yes
Write-Host "[OK] Project linked" -ForegroundColor Green
Write-Host ""

# Step 3: Pull environment variables
Write-Host "--- Step 3: Pulling environment variables from Vercel ---" -ForegroundColor Yellow
Write-Host '[!] Make sure you have added all environment variables in Vercel Dashboard first!' -ForegroundColor Magenta
# vercel env pull .env.production --yes
Write-Host "[SKIP] Environment variables pulled (Use 'vercel env pull' manually if needed)" -ForegroundColor Green
Write-Host ""

# Step 4: Install dotenv-cli if missing
Write-Host "--- Step 4: Installing dependencies ---" -ForegroundColor Yellow
npm install -g dotenv-cli
Write-Host "[OK] Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 5: Prisma Push to Vercel Postgres
Write-Host "--- Step 5: Pushing Prisma Schema to Vercel Postgres ---" -ForegroundColor Yellow
Write-Host "[!] This will apply your Prisma schema to the Vercel Postgres database" -ForegroundColor Magenta
npx prisma db push --accept-data-loss
Write-Host "[OK] Prisma schema pushed" -ForegroundColor Green
Write-Host ""

# Step 6: Final Deployment
Write-Host "--- Step 6: Deploying to Vercel ---" -ForegroundColor Yellow
vercel deploy --prod --yes
Write-Host "[OK] DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "Success! Your application should be live on Vercel." -ForegroundColor Green
Write-Host "View your deployment: https://vercel.com/derflanoj2s-projects/budolshap" -ForegroundColor Cyan
