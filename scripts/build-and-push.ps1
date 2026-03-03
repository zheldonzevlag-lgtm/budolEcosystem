#===============================================================================
# Docker Build and Push Script for budolEcosystem
# Builds all service images and pushes to ECR
#===============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Service,
    
    [Parameter(Mandatory=$false)]
    [string]$Action = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$ImageTag = "v1.0.0"
)

# Configuration
$env:AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-southeast-1" }
$env:AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$env:ECR_REGISTRY = "$env:AWS_ACCOUNT_ID.dkr.ecr.$env:AWS_REGION.amazonaws.com"
$env:ECR_REPO_PREFIX = "budolecosystem"
$env:IMAGE_TAG = $ImageTag

# Services to build
$Services = @(
    "budolid",
    "budolaccounting",
    "budolpay-gateway",
    "budolpay-auth",
    "budolpay-wallet",
    "budolpay-transaction",
    "budolpay-payment",
    "budolpay-kyc",
    "budolpay-settlement"
)

# Dockerfile targets mapping
$Targets = @{
    "budolid" = "budol-id"
    "budolaccounting" = "budol-accounting"
    "budolpay-gateway" = "budol-gateway"
    "budolpay-auth" = "budol-auth"
    "budolpay-wallet" = "budol-wallet"
    "budolpay-transaction" = "budol-tx"
    "budolpay-payment" = "budol-payment"
    "budolpay-kyc" = "budol-kyc"
    "budolpay-settlement" = "budol-settlement"
}

function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-LogWarn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-LogInfo "Checking prerequisites..."
    
    # Check Docker
    try {
        $dockerVersion = docker --version 2>$null
        if (-not $dockerVersion) {
            throw "Docker not found"
        }
        Write-LogInfo "Docker: $dockerVersion"
    }
    catch {
        Write-LogError "Docker is not installed or not running"
        exit 1
    }
    
    # Check Docker is running
    try {
        docker info 2>$null | Out-Null
    }
    catch {
        Write-LogError "Docker is not running. Please start Docker Desktop."
        exit 1
    }
    
    # Check AWS CLI
    try {
        $awsVersion = aws --version 2>$null
        Write-LogInfo "AWS CLI: $awsVersion"
    }
    catch {
        Write-LogError "AWS CLI is not installed"
        exit 1
    }
    
    # Check AWS credentials
    if (-not $env:AWS_ACCOUNT_ID) {
        Write-LogError "AWS credentials not configured"
        exit 1
    }
    
    Write-LogInfo "AWS Account: $env:AWS_ACCOUNT_ID"
    Write-LogInfo "AWS Region: $env:AWS_REGION"
    Write-LogInfo "Image Tag: $env:IMAGE_TAG"
}

function Connect-ECR {
    Write-LogInfo "Logging into ECR..."
    $password = aws ecr get-login-password --region $env:AWS_REGION
    $password | docker login --username AWS --password-stdin $env:ECR_REGISTRY
    Write-LogInfo "ECR login successful"
}

function Build-Image {
    param([string]$Service)
    
    $target = $Targets[$Service]
    $imageName = "$env:ECR_REGISTRY/$env:ECR_REPO_PREFIX/$Service"
    
    Write-LogInfo "Building $Service (target: $target)..."
    
    docker build -f Dockerfile.backend --target $target -t "${imageName}:${env:IMAGE_TAG}" -t "${imageName}:latest" .
    
    if ($LASTEXITCODE -ne 0) {
        Write-LogError "Failed to build $Service"
        exit 1
    }
    
    Write-LogInfo "$Service built successfully"
}

function Push-Image {
    param([string]$Service)
    
    $imageName = "$env:ECR_REGISTRY/$env:ECR_REPO_PREFIX/$Service"
    
    Write-LogInfo "Pushing $Service to ECR..."
    
    docker push "${imageName}:${env:IMAGE_TAG}"
    docker push "${imageName}:latest"
    
    if ($LASTEXITCODE -ne 0) {
        Write-LogError "Failed to push $Service"
        exit 1
    }
    
    Write-LogInfo "$Service pushed successfully"
}

function Build-All {
    Write-LogInfo "Building all service images..."
    
    foreach ($service in $Services) {
        Build-Image -Service $service
    }
    
    Write-LogInfo "All images built successfully"
}

function Push-All {
    Write-LogInfo "Pushing all service images to ECR..."
    
    foreach ($service in $Services) {
        Push-Image -Service $service
    }
    
    Write-LogInfo "All images pushed successfully"
}

function Get-ServiceList {
    Write-Host "Available services:"
    foreach ($service in $Services) {
        Write-Host "  - $service"
    }
}

# Main
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  budolEcosystem Docker Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Test-Prerequisites

switch ($Action.ToLower()) {
    "build" {
        Connect-ECR
        Build-All
    }
    "push" {
        Connect-ECR
        Push-All
    }
    "all" {
        Connect-ECR
        Build-All
        Push-All
    }
    "list" {
        Get-ServiceList
    }
    default {
        if ($Service) {
            Connect-ECR
            Build-Image -Service $Service
            Push-Image -Service $Service
        }
        else {
            Connect-ECR
            Build-All
            Push-All
        }
    }
}

Write-LogInfo "Docker build and push completed!"
Write-LogInfo "Image Tag: $env:IMAGE_TAG"
