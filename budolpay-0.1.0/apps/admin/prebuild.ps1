# prebuild.ps1
# Prebuild script for Vercel deployment
# Copies workspace packages into the admin directory so Vercel can resolve them

$ErrorActionPreference = "Stop"

Write-Host "Running prebuild: copying workspace packages..." -ForegroundColor Yellow

$packages = @("audit", "database", "notifications", "security")
$sourceBase = "..\..\..\packages"
$targetBase = "..\..\..\node_modules\@budolpay"

# Ensure target directory exists
if (-not (Test-Path $targetBase)) {
    New-Item -ItemType Directory -Path $targetBase -Force | Out-Null
}

foreach ($pkg in $packages) {
    $source = Join-Path $sourceBase $pkg
    $target = Join-Path $targetBase $pkg
    
    if (Test-Path $source) {
        if (Test-Path $target) {
            Remove-Item -Path $target -Recurse -Force
        }
        Copy-Item -Path $source -Destination $target -Recurse
        Write-Host "  Copied: $pkg" -ForegroundColor Green
    } else {
        Write-Host "  Warning: $pkg not found at $source" -ForegroundColor Yellow
    }
}

Write-Host "Prebuild complete." -ForegroundColor Green
