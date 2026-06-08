# verify-no-hardcoded-secrets.ps1
# Run this script to verify no hardcoded secrets remain in the codebase

$ErrorActionPreference = "Continue"
$found = $false

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Secret Verification Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Patterns to search for (known hardcoded secrets)
$patterns = @(
    @{ Pattern = "GJ7Lxn0/kdV"; Description = "JWT Secret (old hardcoded value)" },
    @{ Pattern = "r00tPassword2026"; Description = "Database Password (old hardcoded value)" },
    @{ Pattern = "budolpay-secret-key-123"; Description = "Docker Compose JWT Secret" },
    @{ Pattern = "bp_key_2025"; Description = "BudolPay API Key (old predictable value)" },
    @{ Pattern = "bs_key_2025"; Description = "BudolShap API Key (old predictable value)" },
    @{ Pattern = "postgres:r00t@"; Description = "Database Credentials in Connection String" },
    @{ Pattern = "budolpostgres:r00tPassword2026"; Description = "Database Credentials in Connection String" }
)

# File extensions to search
$extensions = @("*.js", "*.ts", "*.jsx", "*.tsx", "*.yml", "*.yaml", "*.json", "*.env", "*.env.*")

# Directories to exclude
$excludeDirs = @("node_modules", ".next", "dist", "build", ".git", "documentation")

Write-Host "Searching for hardcoded secrets..." -ForegroundColor Yellow
Write-Host ""

foreach ($p in $patterns) {
    $results = Get-ChildItem -Path . -Include $extensions -Recurse -File |
        Where-Object { 
            $path = $_.FullName
            -not ($excludeDirs | ForEach-Object { $path -like "*\$_\*" } | Where-Object { $_ })
        } |
        Select-String -Pattern $p.Pattern -SimpleMatch
    
    if ($results) {
        $found = $true
        Write-Host "[FOUND] $($p.Description)" -ForegroundColor Red
        foreach ($r in $results) {
            Write-Host "  File: $($r.Path)" -ForegroundColor Gray
            Write-Host "  Line: $($r.LineNumber)" -ForegroundColor Gray
            Write-Host "  Content: $($r.Line.Trim())" -ForegroundColor Gray
            Write-Host ""
        }
    }
}

Write-Host "========================================" -ForegroundColor Cyan

if ($found) {
    Write-Host "FAILED: Hardcoded secrets found!" -ForegroundColor Red
    Write-Host "Please rotate these secrets before deployment." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "PASSED: No hardcoded secrets found." -ForegroundColor Green
    Write-Host "All secrets should be in environment variables." -ForegroundColor Green
    exit 0
}
