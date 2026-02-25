# Quick Deployment Script for Vercel Postgres

Write-Host "🚀 Budolshap Vercel Deployment with Postgres" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Ensure Vercel login
Write-Host "📝 Step 1: Checking Vercel login status..." -ForegroundColor Yellow
vercel whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Vercel. Logging in..." -ForegroundColor Red
    vercel login
}
Write-Host "✅ Logged in to Vercel" -ForegroundColor Green
Write-Host ""

# Step 2: Link project
Write-Host "📝 Step 2: Linking project..." -ForegroundColor Yellow
vercel link
Write-Host "✅ Project linked" -ForegroundColor Green
Write-Host ""

# Step 3: Pull environment variables
Write-Host "📝 Step 3: Pulling environment variables from Vercel..." -ForegroundColor Yellow
Write-Host '⚠️  Make sure you''ve added all environment variables in Vercel Dashboard first!' -ForegroundColor Magenta
$continue = Read-Host "Have you added all environment variables? (y/n)"
if ($continue -ne "y") {
    Write-Host "❌ Please add environment variables first, then run this script again." -ForegroundColor Red
    exit 1
}
vercel env pull .env.production
Write-Host "✅ Environment variables pulled" -ForegroundColor Green
Write-Host ""

# Step 4: Install dotenv-cli if missing
npm list -g dotenv-cli 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing dotenv-cli..." -ForegroundColor Yellow
    npm install -g dotenv-cli
}

# Step 5: Run database migration (reset & apply)
Write-Host "📝 Step 4: Running database migration..." -ForegroundColor Yellow
Write-Host "This will apply your Prisma schema to the Vercel Postgres database" -ForegroundColor Cyan
npx dotenv -e .env.production -- npx prisma db push
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database reset and migration successful!" -ForegroundColor Green
}
else {
    Write-Host "❌ Migration failed. Check the error above." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: Deploy to production
Write-Host "📝 Step 5: Deploying to production..." -ForegroundColor Yellow
$deploy = Read-Host "Ready to deploy to production? (y/n)"
if ($deploy -eq "y") {
    vercel --prod
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
}
else {
    Write-Host "⏭️  Skipping deployment. You can deploy manually with: vercel --prod" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "🎉 All done! Your application should be live on Vercel." -ForegroundColor Green
Write-Host "📊 View your deployment: https://vercel.com/derflanoj2s-projects/budolshap" -ForegroundColor Cyan
