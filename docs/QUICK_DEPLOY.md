# Quick Deploy Commands Reference

This document provides a single-page reference for all deployment commands for both bash and PowerShell environments.

---

## Table of Contents

1. [PowerShell Commands (Windows)](#powershell-commands-windows)
2. [Bash Commands (Linux/macOS)](#bash-commands-linuxmacos)
3. [Service-Specific Commands](#service-specific-commands)
4. [Verification Commands](#verification-commands)
5. [Environment Variables](#environment-variables)

---

## PowerShell Commands (Windows)

### Full Deployment

```powershell
# Complete deployment to production
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action all
```

### Individual Steps

```powershell
# 1. Build and push Docker images
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action build

# 2. Register ECS task definitions
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action register

# 3. Create ECS services (first time only)
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action create

# 4. Deploy/update services
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy
```

### Status and Verification

```powershell
# Check service status
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action status

# Wait for deployment to complete
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action wait

# Run E2E tests
.\scripts\test_scripts\run-e2e-tests.ps1 -Environment production -TestType all

# Run health checks only
.\scripts\test_scripts\run-e2e-tests.ps1 -Environment production -TestType health
```

---

## Bash Commands (Linux/macOS)

### Full Deployment

```bash
# Complete deployment to production
./scripts/ecs-deploy.sh production all
```

### Individual Steps

```bash
# 1. Build and push Docker images
./scripts/ecs-deploy.sh production build

# 2. Register ECS task definitions
./scripts/ecs-deploy.sh production register

# 3. Create ECS services (first time only)
./scripts/ecs-deploy.sh production create

# 4. Deploy/update services
./scripts/ecs-deploy.sh production deploy
```

### Status and Verification

```bash
# Check service status
./scripts/ecs-deploy.sh production status

# Wait for deployment to complete
./scripts/ecs-deploy.sh production wait

# Run E2E tests
node scripts/test_scripts/e2e-checkout-flow.mjs --env=production
```

---

## Service-Specific Commands

### Deploy Individual Service

```powershell
# PowerShell - Deploy specific service
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy -Service budolid
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy -Service budolPayGateway
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy -Service budolPayAuth
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy -Service budolPayWallet
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy -Service budolPayTransaction
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy -Service budolPayPayment
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy -Service budolAccounting
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy -Service budolPayKYC
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy -Service budolPaySettlement
```

```bash
# Bash - Deploy specific service
./scripts/ecs-deploy.sh production deploy budolid
./scripts/ecs-deploy.sh production deploy budolPayGateway
./scripts/ecs-deploy.sh production deploy budolPayAuth
./scripts/ecs-deploy.sh production deploy budolPayWallet
./scripts/ecs-deploy.sh production deploy budolPayTransaction
./scripts/ecs-deploy.sh production deploy budolPayPayment
./scripts/ecs-deploy.sh production deploy budolAccounting
./scripts/ecs-deploy.sh production deploy budolPayKYC
./scripts/ecs-deploy.sh production deploy budolPaySettlement
```

### Deploy to Different Environment

```powershell
# PowerShell - Staging
.\scripts\ecs-deploy-windows.ps1 -Environment staging -Action all

# PowerShell - Development
.\scripts\ecs-deploy-windows.ps1 -Environment development -Action all
```

```bash
# Bash - Staging
./scripts/ecs-deploy.sh staging all

# Bash - Development
./scripts/ecs-deploy.sh development all
```

---

## Verification Commands

### Check ECS Services

```powershell
# PowerShell
aws ecs describe-services `
    --cluster budolEcosystem-production `
    --services budolID budolAccounting budolPayGateway budolPayAuth `
    --region ap-southeast-1 `
    --query 'services[*].{Service:serviceName,Status:status,Running:runningCount,Desired:desiredCount}'
```

```bash
# Bash
aws ecs describe-services \
    --cluster budolEcosystem-production \
    --services budolID budolAccounting budolPayGateway budolPayAuth \
    --region ap-southeast-1 \
    --query 'services[*].{Service:serviceName,Status:status,Running:runningCount,Desired:desiredCount}'
```

### Check Task Definitions

```powershell
# PowerShell
aws ecs list-task-definitions `
    --family-prefix budolID `
    --status ACTIVE `
    --sort DESC `
    --max-items 5 `
    --region ap-southeast-1
```

```bash
# Bash
aws ecs list-task-definitions \
    --family-prefix budolID \
    --status ACTIVE \
    --sort DESC \
    --max-items 5 \
    --region ap-southeast-1
```

### Check CloudWatch Logs

```powershell
# PowerShell - View logs for specific service
aws logs tail /ecs/budolID --follow --region ap-southeast-1

# View logs for last hour
aws logs tail /ecs/budolPayGateway --since 1h --region ap-southeast-1
```

```bash
# Bash - View logs for specific service
aws logs tail /ecs/budolID --follow --region ap-southeast-1

# View logs for last hour
aws logs tail /ecs/budolPayGateway --since 1h --region ap-southeast-1
```

### Test Service Health

```powershell
# PowerShell
Invoke-WebRequest -Uri "https://budolid.budol.internal/health" -Method Get
Invoke-WebRequest -Uri "https://api.budolpay.duckdns.org/health" -Method Get
```

```bash
# Bash
curl -k https://budolid.budol.internal/health
curl -k https://api.budolpay.duckdns.org/health
```

---

## Environment Variables

### Set via PowerShell

```powershell
# Set environment variables
$env:AWS_REGION = "ap-southeast-1"
$env:IMAGE_TAG = "v1.0.0"
$env:ENVIRONMENT = "production"
```

### Set via Bash

```bash
# Set environment variables
export AWS_REGION="ap-southeast-1"
export IMAGE_TAG="v1.0.0"
export ENVIRONMENT="production"
```

### Available Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_REGION` | ap-southeast-1 | AWS region |
| `IMAGE_TAG` | latest | Docker image tag |
| `ENVIRONMENT` | production | Deployment environment |

---

## Common Workflows

### Development Workflow

```powershell
# 1. Make code changes
# 2. Build and test locally with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# 3. Push to ECR
.\scripts\ecs-deploy-windows.ps1 -Environment development -Action build

# 4. Deploy to ECS
.\scripts\ecs-deploy-windows.ps1 -Environment development -Action all

# 5. Run tests
.\scripts\test_scripts\run-e2e-tests.ps1 -Environment development -TestType all
```

### Production Deployment Workflow

```powershell
# 1. Ensure tests pass in staging first
.\scripts\ecs-deploy-windows.ps1 -Environment staging -Action all
.\scripts\test_scripts\run-e2e-tests.ps1 -Environment staging -TestType all

# 2. Tag images for production
$env:IMAGE_TAG = "v1.0.0"
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action build

# 3. Deploy to production
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action all

# 4. Verify deployment
.\scripts\ecs-deploy-windows production -Action status.ps1 -Environment

# 5. Run E2E tests
.\scripts\test_scripts\run-e2e-tests.ps1 -Environment production -TestType all
```

### Rollback Workflow

```powershell
# 1. Find previous task definition
aws ecs list-task-definitions `
    --family-prefix budolID `
    --status ACTIVE `
    --sort DESC `
    --max-items 2 `
    --query 'taskDefinitionArns[1]' `
    --output text

# 2. Rollback specific service
aws ecs update-service `
    --cluster budolEcosystem-production `
    --service budolID `
    --task-definition "arn:aws:ecs:ap-southeast-1:ACCOUNT_ID:task-definition/budolID:PREVIOUS_VERSION" `
    --region ap-southeast-1
```

---

## Troubleshooting Commands

### Check AWS Credentials

```powershell
# PowerShell
aws sts get-caller-identity
```

```bash
# Bash
aws sts get-caller-identity
```

### Check ECR Login

```powershell
# PowerShell
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com
```

```bash
# Bash
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com
```

### Check ECS Cluster Status

```powershell
# PowerShell
aws ecs describe-clusters `
    --clusters budolEcosystem-production `
    --region ap-southeast-1
```

```bash
# Bash
aws ecs describe-clusters \
    --clusters budolEcosystem-production \
    --region ap-southeast-1
```

---

## Quick Command Reference Card

| Task | PowerShell | Bash |
|------|------------|------|
| Full Deploy | `.\scripts\ecs-deploy-windows.ps1 -Environment production -Action all` | `./scripts/ecs-deploy.sh production all` |
| Build Only | `.\scripts\ecs-deploy-windows.ps1 -Environment production -Action build` | `./scripts/ecs-deploy.sh production build` |
| Deploy Only | `.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy` | `./scripts/ecs-deploy.sh production deploy` |
| Check Status | `.\scripts\ecs-deploy-windows.ps1 -Environment production -Action status` | `./scripts/ecs-deploy.sh production status` |
| Run Tests | `.\scripts\test_scripts\run-e2e-tests.ps1 -Environment production -TestType all` | `node scripts/test_scripts/e2e-checkout-flow.mjs --env=production` |
| Single Service | `.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy -Service budolid` | `./scripts/ecs-deploy.sh production deploy budolid` |
