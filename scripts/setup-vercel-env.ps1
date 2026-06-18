# setup-vercel-env.ps1
# Setup environment variables for Vercel staging deployment
# Usage: .\scripts\setup-vercel-env.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Vercel Environment Setup (Staging)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Vercel CLI
if (-not (Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Vercel CLI not found. Install with: npm i -g vercel" -ForegroundColor Red
    exit 1
}

# Generate secrets
Write-Host "Step 1/4: Generating secrets..." -ForegroundColor Yellow
$jwtSecret = node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
$internalApiKey = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Write-Host "  Generated JWT_SECRET" -ForegroundColor Green
Write-Host "  Generated INTERNAL_API_KEY" -ForegroundColor Green
Write-Host ""

# Prompt for database URL
Write-Host "Step 2/4: Database configuration..." -ForegroundColor Yellow
$dbUrl = Read-Host "Enter PostgreSQL URL (staging)"
if (-not $dbUrl) {
    Write-Host "  ERROR: Database URL required" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Prompt for allowed origins
Write-Host "Step 3/4: CORS configuration..." -ForegroundColor Yellow
$allowedOrigins = Read-Host "Enter allowed origins (comma-separated, e.g. https://staging.budolshap.vercel.app)"
if (-not $allowedOrigins) {
    $allowedOrigins = "https://staging.budolshap.vercel.app"
}
Write-Host ""

# Deploy to each Vercel project
Write-Host "Step 4/4: Setting environment variables..." -ForegroundColor Yellow

$projects = @(
    @{ Name = "budol-id"; Dir = "budolID-0.1.0" },
    @{ Name = "budol-pay"; Dir = "budolpay-0.1.0" },
    @{ Name = "budol-shap"; Dir = "budolshap-0.1.0" },
    @{ Name = "budol-accounting"; Dir = "budolAccounting-0.1.0" }
)

foreach ($proj in $projects) {
    if (-not (Test-Path $proj.Dir)) {
        Write-Host "  SKIP: $($proj.Dir) not found" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "  Setting env for $($proj.Name)..." -ForegroundColor Gray
    
    Push-Location $proj.Dir
    try {
        # Set environment variables
        $envVars = @{
            "JWT_SECRET" = $jwtSecret
            "DATABASE_URL" = $dbUrl
            "ALLOWED_ORIGINS" = $allowedOrigins
            "INTERNAL_API_KEY" = $internalApiKey
            "NODE_ENV" = "staging"
        }
        
        foreach ($key in $envVars.Keys) {
            $val = $envVars[$key]
            echo $val | vercel env add $key production 2>&1 | Out-Null
        }
        
        Write-Host "    PASS: $($proj.Name) configured" -ForegroundColor Green
    } catch {
        Write-Host "    FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
    Pop-Location
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Environment Variables Set" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Generated values (save these securely):" -ForegroundColor Yellow
Write-Host "  JWT_SECRET: $jwtSecret" -ForegroundColor Gray
Write-Host "  INTERNAL_API_KEY: $internalApiKey" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run .\scripts\deploy-staging.ps1" -ForegroundColor Gray
Write-Host "  2. Verify in Vercel dashboard" -ForegroundColor Gray
