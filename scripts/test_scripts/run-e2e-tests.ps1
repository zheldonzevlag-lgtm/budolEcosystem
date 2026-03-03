#Requires -Version 5.1
<#
.SYNOPSIS
    Windows E2E Test Runner for budolEcosystem
.DESCRIPTION
    Runs Node.js E2E tests from Windows and checks service health.
.PARAMETER Environment
    Test environment: local, staging, production
.PARAMETER TestType
    Type of tests to run: checkout, health, all
.PARAMETER SkipAuth
    Skip authentication tests
.PARAMETER SkipPayment
    Skip payment tests
.PARAMETER Verbose
    Enable verbose output
.EXAMPLE
    .\run-e2e-tests.ps1 -Environment local
.EXAMPLE
    .\run-e2e-tests.ps1 -Environment production -TestType all
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('local', 'staging', 'production')]
    [string]$Environment = 'local',

    [Parameter(Mandatory=$false)]
    [ValidateSet('checkout', 'health', 'all')]
    [string]$TestType = 'all',

    [Parameter(Mandatory=$false)]
    [switch]$SkipAuth,

    [Parameter(Mandatory=$false)]
    [switch]$SkipPayment,

    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# ============================================================================
# Configuration
# ============================================================================

$script:AWS_REGION = "ap-southeast-1"
$script:CLUSTER_NAME = "budolEcosystem-$Environment"

# Color codes
$script:RED = "`e[0;31m"
$script:GREEN = "`e[0;32m"
$script:YELLOW = "`e[1;33m"
$script:BLUE = "`e[0;34m"
$script:NC = "`e[0m"

# Service endpoints based on environment
$script:ServiceEndpoints = @{
    local = @{
        "budolID" = "http://localhost:8000"
        "budolShap" = "http://localhost:3001"
        "budolPayGateway" = "http://localhost:8080"
        "budolPayAuth" = "http://localhost:8001"
        "budolPayWallet" = "http://localhost:8002"
        "budolPayTransaction" = "http://localhost:8003"
        "budolPayPayment" = "http://localhost:8004"
        "budolAccounting" = "http://localhost:8005"
        "budolPayKYC" = "http://localhost:8006"
        "budolPaySettlement" = "http://localhost:8007"
    }
    staging = @{
        "budolID" = "https://budolid.staging.budol.internal"
        "budolShap" = "https://staging.budolshap.duckdns.org"
        "budolPayGateway" = "https://api.staging.budolpay.duckdns.org"
        "budolPayAuth" = "https://budolpay-auth.staging.budol.internal"
        "budolPayWallet" = "https://budolpay-wallet.staging.budol.internal"
        "budolPayTransaction" = "https://budolpay-transaction.staging.budol.internal"
        "budolPayPayment" = "https://budolpay-payment.staging.budol.internal"
        "budolAccounting" = "https://budolaccounting.staging.budol.internal"
        "budolPayKYC" = "https://budolpay-kyc.staging.budol.internal"
        "budolPaySettlement" = "https://budolpay-settlement.staging.budol.internal"
    }
    production = @{
        "budolID" = "https://budolid.budol.internal"
        "budolShap" = "https://budolshap.duckdns.org"
        "budolPayGateway" = "https://api.budolpay.duckdns.org"
        "budolPayAuth" = "https://budolpay-auth.budol.internal"
        "budolPayWallet" = "https://budolpay-wallet.budol.internal"
        "budolPayTransaction" = "https://budolpay-transaction.budol.internal"
        "budolPayPayment" = "https://budolpay-payment.budol.internal"
        "budolAccounting" = "https://budolaccounting.budol.internal"
        "budolPayKYC" = "https://budolpay-kyc.budol.internal"
        "budolPaySettlement" = "https://budolpay-settlement.budol.internal"
    }
}

# ============================================================================
# Helper Functions
# ============================================================================

function Write-LogInfo {
    param([string]$Message)
    Write-Host "$script:GREEN[INFO]$script:NC $Message"
}

function Write-LogWarn {
    param([string]$Message)
    Write-Host "$script:YELLOW[WARN]$script:NC $Message"
}

function Write-LogError {
    param([string]$Message)
    Write-Host "$script:RED[ERROR]$script:NC $Message"
}

function Write-LogStep {
    param([string]$Message)
    Write-Host "$script:BLUE[STEP]$script:NC $Message"
}

function Test-CommandExists {
    param([string]$Command)
    return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# ============================================================================
# Check Prerequisites
# ============================================================================

function Test-Prerequisites {
    Write-LogStep "Checking prerequisites..."
    
    # Check Node.js
    if (-not (Test-CommandExists "node")) {
        Write-LogError "Node.js is not installed"
        Write-Host "Please install Node.js: https://nodejs.org/"
        exit 1
    }
    
    $nodeVersion = node --version
    Write-LogInfo "Node.js version: $nodeVersion"
    
    # Check npm
    if (-not (Test-CommandExists "npm")) {
        Write-LogError "npm is not installed"
        exit 1
    }
    
    $npmVersion = npm --version
    Write-LogInfo "npm version: $npmVersion"
    
    Write-LogInfo "Prerequisites check passed"
}

# ============================================================================
# Check Service Health (Local/ECS)
# ============================================================================

function Test-ServiceHealth {
    param([string]$ServiceName, [string]$Endpoint)
    
    Write-LogInfo "Checking $ServiceName health..."
    
    try {
        # Try /health endpoint first
        $healthEndpoint = "$Endpoint/health"
        
        if ($Verbose) {
            Write-Host "  Testing: $healthEndpoint" -ForegroundColor Gray
        }
        
        $response = Invoke-WebRequest -Uri $healthEndpoint -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-LogInfo "  $ServiceName is HEALTHY"
            return $true
        }
    } catch {
        # Try root endpoint as fallback
        try {
            $response = Invoke-WebRequest -Uri $Endpoint -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-LogInfo "  $ServiceName is HEALTHY (responded on root)"
                return $true
            }
        } catch {}
    }
    
    Write-LogWarn "  $ServiceName is NOT RESPONDING"
    return $false
}

function Test-ECSServiceHealth {
    param([string]$ServiceName)
    
    Write-LogInfo "Checking ECS $ServiceName health..."
    
    # Get service status from ECS
    $serviceStatus = aws ecs describe-services `
        --cluster $script:CLUSTER_NAME `
        --services $ServiceName `
        --region $script:AWS_REGION `
        --query 'services[0]' `
        --output json 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-LogWarn "  $ServiceName not found in ECS cluster"
        return $false
    }
    
    $status = $serviceStatus | ConvertFrom-Json
    
    $running = $status.runningCount
    $desired = $status.desiredCount
    $serviceState = $status.status
    
    Write-Host "  Status: $serviceState, Running: $running/$desired" -ForegroundColor Gray
    
    if ($running -ge $desired -and $running -gt 0) {
        Write-LogInfo "  $ServiceName is HEALTHY"
        return $true
    }
    
    Write-LogWarn "  $ServiceName is NOT HEALTHY"
    return $false
}

function Invoke-HealthCheck {
    Write-LogStep "Running health checks..."
    
    $endpoints = $script:ServiceEndpoints[$Environment]
    $allHealthy = $true
    
    Write-Host ""
    
    # For local environment, test HTTP endpoints
    if ($Environment -eq "local") {
        foreach ($service in $endpoints.Keys) {
            $healthy = Test-ServiceHealth -ServiceName $service -Endpoint $endpoints[$service]
            if (-not $healthy) {
                $allHealthy = $false
            }
        }
    } else {
        # For staging/production, check ECS services
        $services = @("budolID", "budolAccounting", "budolPayGateway", "budolPayAuth", "budolPayWallet", "budolPayTransaction", "budolPayPayment", "budolPayKYC", "budolPaySettlement")
        
        foreach ($service in $services) {
            $healthy = Test-ECSServiceHealth -ServiceName $service
            if (-not $healthy) {
                $allHealthy = $false
            }
        }
    }
    
    Write-Host ""
    
    if ($allHealthy) {
        Write-LogInfo "All services are healthy!"
        return $true
    } else {
        Write-LogError "Some services are not healthy"
        return $false
    }
}

# ============================================================================
# Run E2E Checkout Tests
# ============================================================================

function Invoke-E2ETests {
    Write-LogStep "Running E2E tests..."
    
    # Check if E2E test file exists
    $testFile = "scripts/test_scripts/e2e-checkout-flow.mjs"
    
    if (-not (Test-Path $testFile)) {
        Write-LogError "E2E test file not found: $testFile"
        exit 1
    }
    
    # Build command arguments
    $nodeArgs = @($testFile)
    
    # Add environment
    $nodeArgs += "--env=$Environment"
    
    # Add optional flags
    if ($SkipAuth) {
        $nodeArgs += "--skip-auth"
    }
    
    if ($SkipPayment) {
        $nodeArgs += "--skip-payment"
    }
    
    if ($Verbose) {
        $nodeArgs += "--verbose"
    }
    
    Write-Host ""
    Write-Host "Running: node $($nodeArgs -join ' ')" -ForegroundColor Cyan
    Write-Host ""
    
    # Run the tests
    $process = Start-Process -FilePath "node" -ArgumentList $nodeArgs -NoNewWindow -Wait -PassThru
    
    Write-Host ""
    
    if ($process.ExitCode -eq 0) {
        Write-LogInfo "E2E tests passed!"
        return $true
    } else {
        Write-LogError "E2E tests failed with exit code: $($process.ExitCode)"
        return $false
    }
}

# ============================================================================
# Show Test Results Summary
# ============================================================================

function Show-TestResults {
    param(
        [bool]$HealthCheckPassed,
        [bool]$E2ETestsPassed
    )
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Test Results Summary" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Environment: $Environment"
    Write-Host "Test Type: $TestType"
    Write-Host "----------------------------------------"
    Write-Host "Health Check: " -NoNewline
    if ($HealthCheckPassed) {
        Write-Host "PASSED" -ForegroundColor Green
    } else {
        Write-Host "FAILED" -ForegroundColor Red
    }
    
    if ($TestType -eq "all" -or $TestType -eq "checkout") {
        Write-Host "E2E Tests: " -NoNewline
        if ($E2ETestsPassed) {
            Write-Host "PASSED" -ForegroundColor Green
        } else {
            Write-Host "FAILED" -ForegroundColor Red
        }
    }
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

# ============================================================================
# Main
# ============================================================================

function Main {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "budolEcosystem E2E Test Runner" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Environment: $Environment"
    Write-Host "Test Type: $TestType"
    Write-Host "Skip Auth: $SkipAuth"
    Write-Host "Skip Payment: $SkipPayment"
    Write-Host "Verbose: $Verbose"
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check prerequisites
    Test-Prerequisites
    
    $healthCheckPassed = $false
    $e2eTestsPassed = $false
    
    # Run health checks
    if ($TestType -eq "health" -or $TestType -eq "all") {
        $healthCheckPassed = Invoke-HealthCheck
    }
    
    # Run E2E tests
    if ($TestType -eq "checkout" -or $TestType -eq "all") {
        $e2eTestsPassed = Invoke-E2ETests
    }
    
    # Show summary
    Show-TestResults -HealthCheckPassed $healthCheckPassed -E2ETestsPassed $e2eTestsPassed
    
    # Exit with appropriate code
    if (($TestType -eq "health" -and $healthCheckPassed) -or 
        ($TestType -eq "checkout" -and $e2eTestsPassed) -or 
        ($TestType -eq "all" -and $healthCheckPassed -and $e2eTestsPassed)) {
        exit 0
    } else {
        exit 1
    }
}

# Run main function
Main
