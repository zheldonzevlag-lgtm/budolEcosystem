# Update Vercel Environment Variables
# This script updates the production URL environment variables

Write-Host "🔧 Updating Vercel Environment Variables" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$DEPLOYMENT_URL = "https://budolshap-ad8khacrm-derflanoj2s-projects.vercel.app"

Write-Host "Setting NEXT_PUBLIC_APP_URL to: $DEPLOYMENT_URL" -ForegroundColor Yellow

# Remove old value if exists
vercel env rm NEXT_PUBLIC_APP_URL production --yes 2>$null

# Add new value
Write-Output $DEPLOYMENT_URL | vercel env add NEXT_PUBLIC_APP_URL production

Write-Host ""
Write-Host "Setting NEXT_PUBLIC_SITE_URL to: $DEPLOYMENT_URL" -ForegroundColor Yellow

# Remove old value if exists
vercel env rm NEXT_PUBLIC_SITE_URL production --yes 2>$null

# Add new value
Write-Output $DEPLOYMENT_URL | vercel env add NEXT_PUBLIC_SITE_URL production

Write-Host ""
Write-Host "✅ Environment variables updated!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next step: Redeploy your application" -ForegroundColor Yellow
Write-Host "Run: vercel --prod" -ForegroundColor Cyan
