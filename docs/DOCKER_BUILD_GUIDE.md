# Docker Build Guide for budolEcosystem

This guide provides step-by-step instructions to build and push Docker images to Amazon ECR for the budolEcosystem ECS deployment.

## Prerequisites

Before building Docker images, ensure you have:

1. **Docker Desktop** installed and running
   - Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
   - macOS: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
   - Linux: [Docker Engine](https://docs.docker.com/engine/install/)

2. **AWS CLI** installed and configured
   ```bash
   aws --version
   aws configure
   ```

3. **AWS credentials** with ECR permissions:
   - `ecr:CreateRepository`
   - `ecr:UploadLayerPart`
   - `ecr:CompleteLayerUpload`
   - `ecr:BatchCheckLayerAvailability`
   - `ecr:GetDownloadUrlForLayer`
   - `ecr:BatchGetImage`

4. **Project dependencies** installed:
   ```bash
   # Install Node.js dependencies for all services
   cd budolID-0.1.0 && npm install && cd ..
   cd budolAccounting-0.1.0 && npm install && cd ..
   cd budolpay-0.1.0 && npm install && cd ..
   ```

## Environment Configuration

Set up your environment variables:

```bash
# AWS Configuration
export AWS_ACCOUNT_ID="123456789012"
export AWS_REGION="ap-southeast-1"
export IMAGE_TAG="v1.0.0"

# ECR Registry URI
export ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
export ECR_REPO_PREFIX="budolEcosystem"
```

For Windows (PowerShell):
```powershell
$env:AWS_ACCOUNT_ID = "123456789012"
$env:AWS_REGION = "ap-southeast-1"
$env:IMAGE_TAG = "v1.0.0"
$env:ECR_REGISTRY = "$env:AWS_ACCOUNT_ID.dkr.ecr.$env:AWS_REGION.amazonaws.com"
$env:ECR_REPO_PREFIX = "budolEcosystem"
```

---

## Step 1: Login to ECR

Before pushing images, authenticate Docker with your ECR registry:

### Linux/macOS (Bash)
```bash
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
```

### Windows (PowerShell)
```powershell
aws ecr get-login-password --region $env:AWS_REGION | docker login --username AWS --password-stdin $env:ECR_REGISTRY
```

Expected output: `Login Succeeded`

---

## Step 2: Build Docker Images

The project uses a multi-stage [`Dockerfile.backend`](../../Dockerfile.backend) to build all service images from a single Dockerfile.

### Build All Images at Once

The most efficient way to build all images is using the multi-stage Dockerfile:

```bash
# Build all service images
docker build -f Dockerfile.backend --target budol-id -t ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolid:latest .
docker build -f Dockerfile.backend --target budol-accounting -t ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolaccounting:latest .
docker build -f Dockerfile.backend --target budol-gateway -t ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-gateway:latest .
docker build -f Dockerfile.backend --target budol-auth -t ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-auth:latest .
docker build -f Dockerfile.backend --target budol-wallet -t ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-wallet:latest .
docker build -f Dockerfile.backend --target budol-tx -t ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-transaction:latest .
docker build -f Dockerfile.backend --target budol-payment -t ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-payment:latest .
docker build -f Dockerfile.backend --target budol-kyc -t ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-kyc:latest .
docker build -f Dockerfile.backend --target budol-settlement -t ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-settlement:latest .
```

### Understanding the Multi-Stage Build

The [`Dockerfile.backend`](../../Dockerfile.backend) uses the following stages:

| Stage | Service | Port | Description |
|-------|---------|------|-------------|
| `budol-id` | budolid | 8000 | SSO/Identity Service |
| `budol-accounting` | budolaccounting | 8005 | Accounting Service |
| `budol-gateway` | budolpay-gateway | 8080 | API Gateway |
| `budol-auth` | budolpay-auth | 8001 | Authentication Service |
| `budol-wallet` | budolpay-wallet | 8002 | Wallet Management |
| `budol-tx` | budolpay-transaction | 8003 | Transaction Processing |
| `budol-payment` | budolpay-payment | 8004 | Payment Gateway |
| `budol-kyc` | budolpay-kyc | 8006 | KYC/Verification |
| `budol-settlement` | budolpay-settlement | 8007 | Settlement Service |

The multi-stage build works as follows:
1. **Base stage**: Installs Node.js 20, OpenSSL, Python3, and build tools
2. **Service-specific stages**: Copy dependencies and build each service

### Verify Build

List built images:
```bash
docker images | grep budol
```

---

## Step 3: Tag Images for ECR

Tag each image with the ECR repository URI and version:

```bash
# budolid
docker tag ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolid:latest ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolid:${IMAGE_TAG}

# budolaccounting
docker tag ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolaccounting:latest ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolaccounting:${IMAGE_TAG}

# budolpay-gateway
docker tag ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-gateway:latest ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-gateway:${IMAGE_TAG}

# budolpay-auth
docker tag ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-auth:latest ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-auth:${IMAGE_TAG}

# budolpay-wallet
docker tag ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-wallet:latest ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-wallet:${IMAGE_TAG}

# budolpay-transaction
docker tag ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-transaction:latest ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-transaction:${IMAGE_TAG}

# budolpay-payment
docker tag ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-payment:latest ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-payment:${IMAGE_TAG}

# budolpay-kyc
docker tag ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-kyc:latest ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-kyc:${IMAGE_TAG}

# budolpay-settlement
docker tag ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-settlement:latest ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolpay-settlement:${IMAGE_TAG}
```

---

## Step 4: Push Images to ECR

Push all tagged images to ECR:

```bash
# Push all services
for service in budolid budolaccounting budolpay-gateway budolpay-auth budolpay-wallet budolpay-transaction budolpay-payment budolpay-kyc budolpay-settlement; do
    echo "Pushing ${service}..."
    docker push ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/${service}:${IMAGE_TAG}
    docker push ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/${service}:latest
done
```

---

## Automated Build Script (Bash)

Save this as `scripts/build-and-push.sh`:

```bash
#!/bin/bash

#===============================================================================
# Docker Build and Push Script for budolEcosystem
# Builds all service images and pushes to ECR
#===============================================================================

set -e

# Configuration
AWS_REGION="${AWS_REGION:-ap-southeast-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
IMAGE_TAG="${IMAGE_TAG:-v1.0.0}"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_REPO_PREFIX="budolEcosystem"

# Services to build
SERVICES=(
    "budolid"
    "budolaccounting"
    "budolpay-gateway"
    "budolpay-auth"
    "budolpay-wallet"
    "budolpay-transaction"
    "budolpay-payment"
    "budolpay-kyc"
    "budolpay-settlement"
)

# Dockerfile stages mapping
declare -A DOCKERFILE_TARGETS=(
    ["budolid"]="budol-id"
    ["budolaccounting"]="budol-accounting"
    ["budolpay-gateway"]="budol-gateway"
    ["budolpay-auth"]="budol-auth"
    ["budolpay-wallet"]="budol-wallet"
    ["budolpay-transaction"]="budol-tx"
    ["budolpay-payment"]="budol-payment"
    ["budolpay-kyc"]="budol-kyc"
    ["budolpay-settlement"]="budol-settlement"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Verify Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    
    # Verify AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi
    
    log_info "All prerequisites satisfied"
    log_info "AWS Account: ${AWS_ACCOUNT_ID}"
    log_info "AWS Region: ${AWS_REGION}"
    log_info "Image Tag: ${IMAGE_TAG}"
}

# Login to ECR
login_ecr() {
    log_info "Logging into ECR..."
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
    log_info "ECR login successful"
}

# Build single service image
build_image() {
    local service=$1
    local target=${DOCKERFILE_TARGETS[$service]}
    local image_name="${ECR_REGISTRY}/${ECR_REPO_PREFIX}/${service}"
    
    log_info "Building ${service} (target: ${target})..."
    
    docker build \
        --file Dockerfile.backend \
        --target "${target}" \
        --tag "${image_name}:${IMAGE_TAG}" \
        --tag "${image_name}:latest" \
        .
    
    log_info "${service} built successfully"
}

# Push single service image
push_image() {
    local service=$1
    local image_name="${ECR_REGISTRY}/${ECR_REPO_PREFIX}/${service}"
    
    log_info "Pushing ${service} to ECR..."
    
    docker push "${image_name}:${IMAGE_TAG}"
    docker push "${image_name}:latest"
    
    log_info "${service} pushed successfully"
}

# Build all images
build_all() {
    log_info "Building all service images..."
    
    for service in "${SERVICES[@]}"; do
        build_image "${service}"
    done
    
    log_info "All images built successfully"
}

# Push all images
push_all() {
    log_info "Pushing all service images to ECR..."
    
    for service in "${SERVICES[@]}"; do
        push_image "${service}"
    done
    
    log_info "All images pushed successfully"
}

# Build and push single service
build_and_push_single() {
    local service=$1
    
    if [[ ! " ${SERVICES[@]} " =~ " ${service} " ]]; then
        log_error "Unknown service: ${service}"
        log_info "Available services: ${SERVICES[*]}"
        exit 1
    fi
    
    build_image "${service}"
    push_image "${service}"
}

# Main
main() {
    echo "========================================"
    echo "  budolEcosystem Docker Build Script"
    echo "========================================"
    
    check_prerequisites
    login_ecr
    
    if [ -n "$1" ]; then
        # Build and push specific service
        build_and_push_single "$1"
    else
        # Build and push all services
        build_all
        push_all
    fi
    
    log_info "Docker build and push completed!"
    log_info "Image Tag: ${IMAGE_TAG}"
}

# Parse arguments
case "${1}" in
    build)
        check_prerequisites
        login_ecr
        build_all
        ;;
    push)
        login_ecr
        push_all
        ;;
    list)
        echo "Available services:"
        for service in "${SERVICES[@]}"; do
            echo "  - ${service}"
        done
        ;;
    *)
        main "$@"
        ;;
esac
```

Make it executable:
```bash
chmod +x scripts/build-and-push.sh
```

Usage:
```bash
# Build and push all services
./scripts/build-and-push.sh

# Build and push specific service
./scripts/build-and-push.sh budolid

# Build only
./scripts/build-and-push.sh build

# Push only
./scripts/build-and-push.sh push

# List available services
./scripts/build-and-push.sh list
```

---

## Automated Build Script (PowerShell)

Save this as `scripts/build-and-push.ps1`:

```powershell
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
$env:ECR_REPO_PREFIX = "budolEcosystem"
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
```

Usage:
```powershell
# Build and push all services
.\scripts\build-and-push.ps1

# Build and push specific service
.\scripts\build-and-push.ps1 -Service budolid

# Build only
.\scripts\build-and-push.ps1 -Action build

# Push only
.\scripts\build-and-push.ps1 -Action push

# List available services
.\scripts\build-and-push.ps1 -Action list
```

---

## Step 5: Verify Images in ECR

After pushing, verify that all images are in ECR:

### List All Images in ECR

```bash
for service in budolid budolaccounting budolpay-gateway budolpay-auth budolpay-wallet budolpay-transaction budolpay-payment budolpay-kyc budolpay-settlement; do
    echo "=== ${service} ==="
    aws ecr list-images \
        --repository-name budolEcosystem/${service} \
        --region ${AWS_REGION} \
        --query 'imageIds[*].imageTag' \
        --output table
    echo ""
done
```

### Verify Specific Image

```bash
# Check if image exists
aws ecr describe-images \
    --repository-name budolEcosystem/budolid \
    --image-tags ${IMAGE_TAG} \
    --region ${AWS_REGION}
```

### Pull Image to Verify

```bash
# Test pull to verify image integrity
docker pull ${ECR_REGISTRY}/${ECR_REPO_PREFIX}/budolid:${IMAGE_TAG}
```

---

## Troubleshooting

### Docker Build Issues

1. **Out of memory**: Increase Docker Desktop memory allocation
2. **Build cache full**: Clear Docker cache
   ```bash
   docker builder prune
   ```

3. **Missing dependencies**: Ensure all `npm install` commands have been run in each service directory

### ECR Push Issues

1. **Authentication expired**: Re-run login command
2. **Repository not found**: Create ECR repository first:
   ```bash
   ./scripts/create-ecr-repositories.sh
   ```

3. **Permission denied**: Verify IAM permissions for ECR

### Common Error Messages

| Error | Solution |
|-------|----------|
| `no basic auth credentials` | Run `aws ecr get-login-password` again |
| `repository does not exist` | Create repository with `aws ecr create-repository` |
| `ImageReferencedByTaskDefinition` | Update ECS service to use new image |

---

## Next Steps

After successfully building and pushing images:

1. **Update ECS Task Definitions** with new image tags
2. **Deploy ECS Services** using the deployment scripts
3. **Verify Deployment** using [`scripts/ecs-verify.sh`](../../scripts/ecs-verify.sh)

See [`docs/ECS_DEPLOYMENT.md`](../../docs/ECS_DEPLOYMENT.md) for complete deployment instructions.
