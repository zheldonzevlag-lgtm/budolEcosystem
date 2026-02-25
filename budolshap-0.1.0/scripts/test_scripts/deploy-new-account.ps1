# Deploy to new Vercel account with automated responses
Write-Host "🚀 Deploying to new Vercel account..." -ForegroundColor Green

# Create input file for vercel CLI
$responses = @"
yes
budolshap
./
no
"@

# Deploy with automated responses
$responses | vercel --prod

Write-Host "`n✅ Deployment initiated!" -ForegroundColor Green
Write-Host "📝 Check the output above for the deployment URL" -ForegroundColor Yellow
