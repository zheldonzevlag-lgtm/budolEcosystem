# Check Vercel Environment Variables

Write-Host "`n🔍 Checking Vercel Environment Variables...`n" -ForegroundColor Cyan

# Get all environment variables
$envVars = vercel env ls 2>&1

Write-Host "Raw output:" -ForegroundColor Yellow
Write-Host $envVars

Write-Host "`n`n📋 Critical Variables Needed:" -ForegroundColor Green
Write-Host "1. DATABASE_URL - For database connection"
Write-Host "2. DIRECT_URL - For Prisma direct connection"
Write-Host "3. JWT_SECRET - For authentication"
Write-Host "4. NEXT_PUBLIC_BASE_URL - For routing"

Write-Host "`n`n💡 To add missing variables:" -ForegroundColor Yellow
Write-Host "1. Go to: https://vercel.com/jons-projects-9722fe4a/budolshap/settings/environment-variables"
Write-Host "2. Click 'Add New'"
Write-Host "3. Add the variable name and value"
Write-Host "4. Select: Production, Preview, Development"
Write-Host "5. Click 'Save'"
Write-Host "6. Run: vercel --prod"
