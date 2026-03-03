# budolEcosystem ECS Deployment Guide

This guide provides step-by-step instructions for deploying the budolEcosystem backend services to AWS ECS using Windows PowerShell.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [AWS Configuration](#aws-configuration)
4. [Deployment Steps](#deployment-steps)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| AWS CLI | 2.x or later | [Download](https://aws.amazon.com/cli/) |
| Docker Desktop | Latest | [Download](https://www.docker.com/products/docker-desktop) |
| Node.js | 18.x or later | [Download](https://nodejs.org/) |
| PowerShell | 5.1 or later | Pre-installed on Windows 10+ |

### Verify Installations

```powershell
# Check AWS CLI
aws --version

# Check Docker
docker --version

# Check Node.js
node --version

# Check npm
npm --version
```

---

## Infrastructure Setup

### 1. Create ECR Repositories

```powershell
# Run the ECR creation script
.\scripts\create-ecr-repositories.ps1
```

Or manually create repositories for each service:
- `budolEcosystem/budolid`
- `budolEcosystem/budolaccounting`
- `budolEcosystem/budolpay-gateway`
- `budolEcosystem/budolpay-auth`
- `budolEcosystem/budolpay-wallet`
- `budolEcosystem/budolpay-transaction`
- `budolEcosystem/budolpay-payment`
- `budolEcosystem/budolpay-kyc`
- `budolEcosystem/budolpay-settlement`

### 2. Deploy CloudFormation Stack

The CloudFormation stack creates:
- ECS Cluster
- VPC with public subnets
- Application Load Balancers (Internal and External)
- Target Groups
- Security Groups
- IAM Roles

```powershell
# Deploy using AWS CLI
aws cloudformation deploy `
    --template-file ecs/cloudformation/ecs-infrastructure.yaml `
    --stack-name budolEcosystem-production `
    --parameter-overrides Environment=production `
    --capabilities CAPABILITY_IAM `
    --region ap-southeast-1
```

### 3. Store Secrets in AWS Secrets Manager

Create secrets for each service:

```powershell
# Example: Create a secret
aws secretsmanager create-secret `
    --name "budolEcosystem/production/JWT_SECRET" `
    --secret-string "your-jwt-secret-value" `
    --region ap-southeast-1
```

Required secrets:
- `budolEcosystem/production/JWT_SECRET`
- `budolEcosystem/production/SSO_JWT_SECRET`
- `budolEcosystem/production/REDIS_PASSWORD`
- `budolEcosystem/production/BUDOLID_DATABASE_URL`
- `budolEcosystem/production/BUDOLPAY_DATABASE_URL`

### 4. Store Configuration in Parameter Store

```powershell
# Example: Store a parameter
aws ssm put-parameter `
    --name "/budolEcosystem/production/ECS_VPC_ID" `
    --value "vpc-xxxxx" `
    --type String `
    --region ap-southeast-1
```

---

## AWS Configuration

### Configure AWS Credentials

```powershell
# Configure AWS CLI
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region name (e.g., `ap-southeast-1`)
- Default output format (e.g., `json`)

### Set Environment Variables (Optional)

```powershell
# Set AWS region
$env:AWS_REGION = "ap-southeast-1"

# Set image tag
$env:IMAGE_TAG = "latest"
```

---

## Deployment Steps

### Step 1: Build and Push Docker Images

```powershell
# Navigate to project directory
cd d:\IT Projects\budolEcosystem

# Build and push all images
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action build
```

This step:
- Logs into ECR
- Builds Docker images for all services
- Pushes images to ECR with tags `latest` and specified tag

### Step 2: Register Task Definitions

```powershell
# Register ECS task definitions
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action register
```

This step:
- Reads task definition JSON files from `ecs/task-definitions/`
- Replaces placeholders (AWS_ACCOUNT_ID, AWS_REGION, IMAGE_TAG)
- Registers task definitions with ECS

### Step 3: Create ECS Services (First Time Only)

```powershell
# Create ECS services
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action create
```

This step:
- Creates ECS services for each microservice
- Associates services with load balancers
- Sets desired task counts

### Step 4: Deploy/Update Services

```powershell
# Deploy all services
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy

# Deploy specific service
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy -Service budolid
```

This step:
- Updates ECS services with latest task definitions
- Triggers new deployment

### Step 5: Full Deployment (All-in-One)

```powershell
# Complete deployment
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action all
```

---

## Verification

### Check Service Status

```powershell
# View service status
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action status
```

Expected output:
```
Service               Desired    Running    Pending    Status
----------------------------------------------------------------------
budolID               2          2          0          ACTIVE
budolAccounting       2          2          0          ACTIVE
budolPayGateway       2          2          0          ACTIVE
budolPayAuth          2          2          0          ACTIVE
budolPayWallet        2          2          0          ACTIVE
...
```

### Wait for Deployment

```powershell
# Wait for all services to be running
.\scripts\ecs-deploy-windows.ps1 -Environment production -Action wait
```

### Run Health Checks

```powershell
# Run health check tests
.\scripts\test_scripts\run-e2e-tests.ps1 -Environment production -TestType health
```

### Run E2E Tests

```powershell
# Run E2E checkout flow tests
.\scripts\test_scripts\run-e2e-tests.ps1 -Environment production -TestType all
```

### Manual Verification

```powershell
# Test service endpoints
Invoke-WebRequest -Uri "https://budolid.budol.internal/health"
Invoke-WebRequest -Uri "https://api.budolpay.duckdns.org/health"
```

---

## Service Endpoints

### Production Environment

| Service | Internal URL | External URL |
|---------|--------------|--------------|
| budolID | https://budolid.budol.internal | - |
| budolAccounting | https://budolaccounting.budol.internal | - |
| budolPayGateway | - | https://api.budolpay.duckdns.org |
| budolPayAuth | https://budolpay-auth.budol.internal | - |
| budolPayWallet | https://budolpay-wallet.budol.internal | - |
| budolPayTransaction | https://budolpay-transaction.budol.internal | - |
| budolPayPayment | https://budolpay-payment.budol.internal | - |
| budolPayKYC | https://budolpay-kyc.budol.internal | - |
| budolPaySettlement | https://budolpay-settlement.budol.internal | - |

---

## Troubleshooting

### Common Issues

#### 1. AWS Credentials Not Configured

```
Error: Unable to locate credentials
```

**Solution:**
```powershell
aws configure
```

#### 2. Docker Login Failed

```
Error: Error logging in to ECR
```

**Solution:**
```powershell
# Ensure Docker Desktop is running
docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com
```

#### 3. Task Definition Registration Failed

```
Error: Invalid task definition
```

**Solution:**
- Check JSON syntax in task definition files
- Verify IAM roles exist
- Ensure AWS_ACCOUNT_ID is correct

#### 4. Service Won't Start

```
Error: Service has no running tasks
```

**Solution:**
1. Check task logs in CloudWatch:
   ```powershell
   aws logs tail /ecs/budolID --follow
   ```
2. Verify secrets are configured correctly
3. Check security group settings

#### 5. Health Check Failures

```
Error: Health check timeout
```

**Solution:**
- Ensure application has `/health` endpoint
- Check security groups allow traffic on service ports
- Verify ALB target group health check settings

### View Logs

```powershell
# View CloudWatch logs for a service
aws logs tail /ecs/budolID --region ap-southeast-1 --follow
```

### Rollback Deployment

```powershell
# Get previous task definition
$prevTaskDef = aws ecs list-task-definitions `
    --family-prefix budolID `
    --status ACTIVE `
    --sort DESC `
    --max-items 2 `
    --query 'taskDefinitionArns[1]' `
    --output text

# Update service with previous task definition
aws ecs update-service `
    --cluster budolEcosystem-production `
    --service budolID `
    --task-definition $prevTaskDef `
    --region ap-southeast-1
```

---

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/ecs/)
- [Docker Documentation](https://docs.docker.com/)

---

## Quick Reference

| Action | Command |
|--------|---------|
| Build images | `.\scripts\ecs-deploy-windows.ps1 -Environment production -Action build` |
| Register tasks | `.\scripts\ecs-deploy-windows.ps1 -Environment production -Action register` |
| Create services | `.\scripts\ecs-deploy-windows.ps1 -Environment production -Action create` |
| Deploy services | `.\scripts\ecs-deploy-windows.ps1 -Environment production -Action deploy` |
| Check status | `.\scripts\ecs-deploy-windows.ps1 -Environment production -Action status` |
| Full deploy | `.\scripts\ecs-deploy-windows.ps1 -Environment production -Action all` |
| Run tests | `.\scripts\test_scripts\run-e2e-tests.ps1 -Environment production -TestType all` |
