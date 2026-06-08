# deploy-staging.ps1
# Deploy all services to Vercel Staging Environment
# Usage: .\scripts\deploy-staging.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Staging Deployment (Vercel)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Vercel CLI
if (-not (Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Vercel CLI not found. Install with: npm i -g vercel" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1/6: Pre-deployment checks..." -ForegroundColor Yellow

# Verify secrets rotation
$secretsOk = $true
$patterns = @("GJ7Lxn0/kdV", "r00tPassword2026", "budolpay-secret-key-123", "bp_key_2025", "bs_key_2025")
foreach ($p in $patterns) {
    $found = Get-ChildItem -Path . -Include "*.js","*.ts","*.jsx","*.tsx" -Recurse -File |
        Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*\.next*" } |
        Select-String -Pattern $p -SimpleMatch
    if ($found) {
        Write-Host "  FAIL: Hardcoded secret found: $p" -ForegroundColor Red
        $secretsOk = $false
    }
}

if (-not $secretsOk) {
    Write-Host ""
    Write-Host "ABORT: Hardcoded secrets detected. Run SECRET-ROTATION-GUIDE.md first." -ForegroundColor Red
    exit 1
}
Write-Host "  PASS: No hardcoded secrets" -ForegroundColor Green
Write-Host ""

$failed = @()

# Step 2: Deploy budolID (SSO)
Write-Host "Step 2/6: Deploying budolID (SSO)..." -ForegroundColor Yellow
Push-Location "budolID-0.1.0"
try {
    vercel deploy --yes --prod 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    if ($LASTEXITCODE -ne 0) { throw "Deploy failed" }
    Write-Host "  PASS: budolID deployed" -ForegroundColor Green
} catch {
    Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $failed += "budolID"
}
Pop-Location
Write-Host ""

# Step 3: Deploy budolPay API (backend)
Write-Host "Step 3/6: Deploying budolPay API (backend)..." -ForegroundColor Yellow
Push-Location "budolpay-0.1.0"
try {
    vercel deploy --yes --prod 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    if ($LASTEXITCODE -ne 0) { throw "Deploy failed" }
    Write-Host "  PASS: budolPay API deployed" -ForegroundColor Green
} catch {
    Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $failed += "budolPay API"
}
Pop-Location
Write-Host ""

# Step 4: Deploy budolPay Admin (from monorepo root, project linked to apps/admin)
Write-Host "Step 4/6: Deploying budolPay Admin..." -ForegroundColor Yellow
Push-Location "budolpay-0.1.0"
try {
    # Temporarily link to budolpay-admin project
    Remove-Item -Path ".vercel" -Recurse -Force -ErrorAction SilentlyContinue
    vercel link --yes --project budolpay-admin 2>&1 | Out-Null
    vercel deploy --yes --prod 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    if ($LASTEXITCODE -ne 0) { throw "Deploy failed" }
    # Clean up link
    Remove-Item -Path ".vercel" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  PASS: budolPay Admin deployed" -ForegroundColor Green
} catch {
    Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $failed += "budolPay Admin"
    Remove-Item -Path ".vercel" -Recurse -Force -ErrorAction SilentlyContinue
}
Pop-Location
Write-Host ""

# Step 5: Deploy budolShap (frontend)
Write-Host "Step 5/6: Deploying budolShap (frontend)..." -ForegroundColor Yellow
Push-Location "budolshap-0.1.0"
try {
    vercel deploy --yes --prod 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    if ($LASTEXITCODE -ne 0) { throw "Deploy failed" }
    Write-Host "  PASS: budolShap deployed" -ForegroundColor Green
} catch {
    Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $failed += "budolShap"
}
Pop-Location
Write-Host ""

# Step 6: Deploy budolAccounting
Write-Host "Step 6/6: Deploying budolAccounting..." -ForegroundColor Yellow
Push-Location "budolAccounting-0.1.0"
try {
    vercel deploy --yes --prod 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    if ($LASTEXITCODE -ne 0) { throw "Deploy failed" }
    Write-Host "  PASS: budolAccounting deployed" -ForegroundColor Green
} catch {
    Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $failed += "budolAccounting"
}
Pop-Location
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($failed.Count -gt 0) {
    Write-Host "Failed services:" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
} else {
    Write-Host "All services deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "URLs:" -ForegroundColor Yellow
    Write-Host "  budolID:       https://budolid-ten.vercel.app" -ForegroundColor Gray
    Write-Host "  budolPay API:  https://budolpay-api-monolith.vercel.app" -ForegroundColor Gray
    Write-Host "  budolPay Admin: https://budolpay-admin-gamma.vercel.app" -ForegroundColor Gray
    Write-Host "  budolShap:     https://budolshap.vercel.app" -ForegroundColor Gray
    Write-Host "  budolAccounting: https://budolaccounting-olive.vercel.app" -ForegroundColor Gray
    Write-Host "  WebSocket:     https://websocket-server-virid.vercel.app" -ForegroundColor Gray
    exit 0
}
