# ECS Fargate Deployment Guide for budolEcosystem

## Overview

This guide covers the deployment of budolEcosystem backend services to AWS ECS Fargate. The system consists of 9 microservices:

| Service | Port | Description |
|---------|------|-------------|
| budolID (SSO) | 8000 | Single Sign-On authentication service |
| budolAccounting | 8005 | Accounting and financial service |
| budolPay Gateway | 8080 | API Gateway for budolPay services |
| budolPay Auth | 8001 | Authentication service |
| budolPay Wallet | 8002 | Wallet management service |
| budolPay Transaction | 8003 | Transaction processing service |
| budolPay Payment | 8004 | Payment gateway service |
| budolPay KYC | 8006 | Verification/KYC service |
| budolPay Settlement | 8007 | Settlement processing service |

## Architecture

```
                                    ┌─────────────────────┐
                                    │   Application Load  │
                                    │      Balancer       │
                                    └──────────┬──────────┘
                                               │
           ┌───────────────────────────────────┼───────────────────────────────────┐
           │                                   │                                   │
    ┌──────▼──────┐                     ┌──────▼──────┐                     ┌──────▼──────┐
    │  budolID    │                     │   budolPay │                     │ budolAcco-  │
    │  (Port 8000)│                     │  Gateway   │                     │ unting      │
    └─────────────┘                     │ (Port 8080)│                     │(Port 8005)  │
                                       └─────────────┘                     └─────────────┘
                                            │
                    ┌───────────┬───────────┼───────────┬───────────┐
                    │           │           │           │           │
             ┌──────▼──┐ ┌──────▼──┐ ┌──────▼──┐ ┌──────▼──┐ ┌──────▼──┐
             │  Auth   │ │ Wallet  │ │Transac- │ │ Payment │ │ KYC/Settle│
             │(8001)   │ │(8002)   │ │tion(8003)│ │(8004)   │ │(8006/7) │
             └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
                    │           │           │           │           │
                    └───────────┴───────────┴───────────┴───────────┘
                                            │
                              ┌─────────────┴─────────────┐
                              │                           │
                        ┌─────▼──────┐            ┌──────▼──────┐
                        │  PostgreSQL │            │    Redis    │
                        │     RDS     │            │ ElastiCache │
                        └─────────────┘            └─────────────┘
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Docker** installed
4. **ECS CLI** installed
5. **Existing Infrastructure**:
   - VPC with public subnets
   - RDS PostgreSQL instance
   - ElastiCache Redis cluster
   - ECR repositories for Docker images

## Deployment Steps

### 1. Infrastructure Setup

Deploy the CloudFormation stack for ECS cluster:

```bash
aws cloudformation deploy \
  --template-file ecs/cloudformation/budol-ecs-cluster.yaml \
  --stack-name budolEcosystem-ECS \
  --parameter-overrides \
    VpcId=vpc-xxxxxxxx \
    SubnetIds=subnet-xxxxx1,subnet-xxxxx2 \
    DatabaseHost=your-rds-endpoint.amazonaws.com \
    RedisHost=your-redis-endpoint.cache.amazonaws.com \
  --capabilities CAPABILITY_NAMED_IAM
```

### 1. Create ECR Repositories

Before building Docker images, create the ECR repositories for all 9 services:

```bash
# Make the script executable
chmod +x scripts/create-ecr-repositories.sh

# Create all ECR repositories
./scripts/create-ecr-repositories.sh

# Or just list existing repositories
./scripts/create-ecr-repositories.sh list
```

This script will create the following ECR repositories:
- `budolEcosystem/budolid`
- `budolEcosystem/budolaccounting`
- `budolEcosystem/budolpay-gateway`
- `budolEcosystem/budolpay-auth`
- `budolEcosystem/budolpay-wallet`
- `budolEcosystem/budolpay-transaction`
- `budolEcosystem/budolpay-payment`
- `budolEcosystem/budolpay-kyc`
- `budolEcosystem/budolpay-settlement`

### 2. Configure SSM Parameters

Apply the SSM parameters:

```bash
# Apply non-sensitive parameters
aws ssm send-command \
  --document-name AWS-RunShellScript \
  --parameters '{"commands": ["cat ssm-ecs-production.json"]}' \
  --instance-id i-xxxxxxxx

# Or run commands directly
cat ssm-ecs-production.json | jq -r '.commands[]' | while read cmd; do
  eval "$cmd"
done
```

### 3. Configure Secrets

Create secrets in AWS Secrets Manager:

```bash
# Run the secrets configuration
cat ssm-ecs-secrets.json | jq -r '.commands[]' | while read cmd; do
  eval "$cmd"
done
```

**Important**: Update the secret values with actual secure passwords before deploying.

### 4. Build and Push Docker Images

```bash
# Make the deployment script executable
chmod +x scripts/ecs-deploy.sh

# Full deployment (build, register, deploy)
./scripts/ecs-deploy.sh production all

# Or run individual steps
./scripts/ecs-deploy.sh production build          # Build and push images
./scripts/ecs-deploy.sh production register       # Register task definitions
./scripts/ecs-deploy.sh production create          # Create ECS services (first time)
./scripts/ecs-deploy.sh production deploy         # Deploy/update services
./scripts/ecs-deploy.sh production status          # Show service status
./scripts/ecs-deploy.sh production wait            # Wait for deployment

# Deploy specific service
./scripts/ecs-deploy.sh production deploy budolid

# With custom image tag
IMAGE_TAG=v1.0.0 ./scripts/ecs-deploy.sh production all
```

Or use the deployment script for automated build and push:

```bash
./scripts/ecs-deploy.sh production build
```

### 5. Register Task Definitions

```bash
# Register all task definitions
./scripts/ecs-deploy.sh production register
```

### 6. Deploy Services

```bash
# Deploy to ECS
./scripts/ecs-deploy.sh production deploy
```

## Service Configuration

### Environment Variables

All services require the following environment variables:

| Variable | Description | Source |
|----------|-------------|--------|
| NODE_ENV | Environment (production/development) | Static |
| PORT | Service port | Static |
| DATABASE_URL | PostgreSQL connection string | Secrets Manager |
| REDIS_URL | Redis connection URL | Static |
| REDIS_PASSWORD | Redis password | Secrets Manager |
| JWT_SECRET | JWT signing secret | Secrets Manager |

### Service-Specific Variables

- **budolID**: `SSO_JWT_SECRET`, `BUDOLSHAP_DATABASE_URL`
- **budolAccounting**: `BUDOLACCOUNTING_DATABASE_URL`
- **Gateway**: All service URLs (auth, wallet, transaction, payment, settlement, kyc, accounting, id)

## Auto-Scaling Configuration

The CloudFormation template includes auto-scaling policies:

| Service | Min Tasks | Max Tasks | CPU Target |
|---------|-----------|-----------|------------|
| budolID | 2 | 10 | 70% |
| budolAccounting | 2 | 10 | 70% |
| budolPay Gateway | 3 | 20 | 70% |

## Security

### Security Groups

1. **ALB Security Group**: Allows HTTP (80) and HTTPS (443) from internet
2. **ECS Security Group**: Allows ports 8000-8007 from ALB security group only

### Secrets Management

- All sensitive data stored in AWS Secrets Manager
- Database credentials
- JWT secrets
- Redis password
- API keys

## Monitoring

### CloudWatch Logs

All services log to CloudWatch Logs with the following groups:
- `/ecs/budolID`
- `/ecs/budolAccounting`
- `/ecs/budolPayGateway`
- `/ecs/budolPayAuth`
- etc.

### Health Checks

Each service exposes a `/health` endpoint for:
- Load balancer health checks
- ECS service discovery

## Local Testing with Docker Compose

Test locally before deploying to ECS:

```bash
# Create production environment file
cp .env .env.production

# Update .env.production with actual values:
# - DATABASE_URL
# - REDIS_PASSWORD
# - JWT_SECRET

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## Troubleshooting

### Check Service Status

```bash
aws ecs describe-services \
  --cluster budolEcosystem-production \
  --services budolID budolAccounting budolPayGateway \
  --region ap-southeast-1
```

### View Logs

```bash
aws logs tail /ecs/budolID --follow --region ap-southeast-1
```

### Check Task Definition

```bash
aws ecs describe-task-definition \
  --task-definition budolID \
  --region ap-southeast-1
```

## Verification

After deployment, verify all services are running correctly using the verification script:

```bash
# Make the verification script executable
chmod +x scripts/ecs-verify.sh

# Run all verification checks
./scripts/ecs-verify.sh

# Run specific checks
./scripts/ecs-verify.sh services   # Check ECS service health
./scripts/ecs-verify.sh targets    # Check target group health
./scripts/ecs-verify.sh dns        # Check internal DNS resolution
./scripts/ecs-verify.sh alb        # Check ALB endpoints
./scripts/ecs-verify.sh logs       # Check CloudWatch logs
./scripts/ecs-verify.sh ssm         # Check SSM parameters
./scripts/ecs-verify.sh secrets     # Check Secrets Manager
```

### Manual Verification Steps

1. **Check ECS Service Status**:
```bash
./scripts/ecs-deploy.sh production status
```

2. **Check Target Group Health**:
```bash
aws elbv2 describe-target-health \
  --target-group-arn $(aws elbv2 describe-target-groups --names budolID-tg --query 'TargetGroups[0].TargetGroupArn' --output text)
```

3. **Test Health Endpoints**:
```bash
# Get ALB DNS name
export ALB_DNS=$(aws elbv2 describe-loadBalancers --names budolEcosystem-ALB-production --query 'LoadBalancers[0].DNSName' --output text)

# Test each service
curl -k https://${ALB_DNS}/budolid/health
curl -k https://${ALB_DNS}/accounting/health
curl -k https://${ALB_DNS}/api/health
```

4. **Test Internal DNS**:
```bash
# From within VPC
nslookup budolid.budol.internal
nslookup budolpay-gateway.budol.internal
```

5. **View CloudWatch Logs**:
```bash
aws logs tail /ecs/budolID --follow --region ap-southeast-1
```

## Rollback Procedure

If deployment fails:

```bash
# Get previous task definition
PREVIOUS_TASK=$(aws ecs list-task-definitions \
  --family-prefix budolID \
  --status ACTIVE \
  --sort DESC \
  --max-items 2 \
  --query 'taskDefinitionArns[1]' \
  --output text)

# Update service to previous version
aws ecs update-service \
  --cluster budolEcosystem-production \
  --service budolID \
  --task-definition ${PREVIOUS_TASK} \
  --force-new-deployment
```

## Service URLs (Production)

After deployment, services will be accessible at:

| Service | Internal URL (DNS) | External URL (via ALB) |
|---------|-------------------|------------------------|
| budolID | http://budolid.budol.internal:8000 | https://budolid.yourdomain.com |
| budolAccounting | http://budolaccounting.budol.internal:8005 | https://accounting.yourdomain.com |
| budolPay Gateway | http://budolpay-gateway.budol.internal:8080 | https://api.budolpay.yourdomain.com |
| budolPay Auth | http://budolpay-auth.budol.internal:8001 | - |
| budolPay Wallet | http://budolpay-wallet.budol.internal:8002 | - |
| budolPay Transaction | http://budolpay-transaction.budol.internal:8003 | - |
| budolPay Payment | http://budolpay-payment.budol.internal:8004 | - |
| budolPay KYC | http://budolpay-kyc.budol.internal:8006 | - |
| budolPay Settlement | http://budolpay-settlement.budol.internal:8007 | - |

## Quick Start Checklist

- [ ] VPC and subnets created
- [ ] RDS PostgreSQL instance running
- [ ] ElastiCache Redis cluster running
- [x] ECR repositories created (`./scripts/create-ecr-repositories.sh`)
- [ ] SSL certificates configured (ACM)
- [x] SSM parameters set (`ssm-ecs-production.json`)
- [x] Secrets configured in Secrets Manager (`ssm-ecs-secrets.json`)
- [x] Docker images built and pushed (`./scripts/ecs-deploy.sh production build`)
- [x] Task definitions registered (`./scripts/ecs-deploy.sh production register`)
- [x] ECS services created (`./scripts/ecs-deploy.sh production create`)
- [x] ECS services deployed (`./scripts/ecs-deploy.sh production deploy`)
- [x] ALB target groups healthy (run `./scripts/ecs-verify.sh targets`)
- [x] DNS records configured (via CloudFormation)
- [x] Health checks passing (run `./scripts/ecs-verify.sh`)

## Complete Deployment Workflow

```bash
# Step 1: Create ECR repositories
./scripts/create-ecr-repositories.sh

# Step 2: Apply SSM parameters
cat ssm-ecs-production.json | jq -r '.commands[]' | while read cmd; do eval "$cmd"; done

# Step 3: Apply secrets
cat ssm-ecs-secrets.json | jq -r '.commands[]' | while read cmd; do eval "$cmd"; done

# Step 4: Deploy CloudFormation stack (first time only)
aws cloudformation deploy \
  --template-file ecs/cloudformation/budol-ecs-cluster.yaml \
  --stack-name budolEcosystem-ECS \
  --parameter-overrides \
    VpcId=vpc-xxxxxxxx \
    SubnetIds=subnet-xxxxx1,subnet-xxxxx2 \
    DatabaseHost=your-rds-endpoint.amazonaws.com \
    RedisHost=your-redis-endpoint.cache.amazonaws.com \
    SSLCertificateArn=arn:aws:acm:ap-southeast-1:123456789012:certificate/xxxxx \
    HostedZoneId=ZXXXXXXXXXXXXX \
  --capabilities CAPABILITY_NAMED_IAM

# Step 5: Full deployment
./scripts/ecs-deploy.sh production all

# Step 6: Verify deployment
./scripts/ecs-verify.sh
```

---

## ALB and DNS Configuration

### ALB Overview

The CloudFormation template creates two Application Load Balancers:

1. **Internet-Facing ALB**: For external traffic (HTTPS termination)
2. **Internal ALB**: For VPC-internal service communication

### Deploying CloudFormation with ALB

```bash
aws cloudformation deploy \
  --template-file ecs/cloudformation/budol-ecs-cluster.yaml \
  --stack-name budolEcosystem-ECS \
  --parameter-overrides \
    VpcId=vpc-xxxxxxxx \
    SubnetIds=subnet-xxxxx1,subnet-xxxxx2 \
    DatabaseHost=your-rds-endpoint.amazonaws.com \
    RedisHost=your-redis-endpoint.cache.amazonaws.com \
    SSLCertificateArn=arn:aws:acm:ap-southeast-1:123456789012:certificate/xxxxx \
    HostedZoneId=ZXXXXXXXXXXXXX \
  --capabilities CAPABILITY_NAMED_IAM
```

### Route 53 Internal DNS Records

After deploying the CloudFormation stack, the following DNS records will be created in the `budol.internal` Private Hosted Zone:

| Record Name | Type | Target |
|-------------|------|--------|
| budolid.budol.internal | A | Internal ALB |
| budolaccounting.budol.internal | A | Internal ALB |
| budolpay-gateway.budol.internal | A | Internal ALB |
| budolpay-auth.budol.internal | A | Internal ALB |
| budolpay-wallet.budol.internal | A | Internal ALB |
| budolpay-transaction.budol.internal | A | Internal ALB |
| budolpay-payment.budol.internal | A | Internal ALB |
| budolpay-kyc.budol.internal | A | Internal ALB |
| budolpay-settlement.budol.internal | A | Internal ALB |

Alternatively, use the [`route53-internal-dns.json`](route53-internal-dns.json) file to manually create these records.

### Service URLs (Production)

| Service | Internal DNS URL | Container URL |
|---------|-----------------|---------------|
| budolID | http://budolid.budol.internal:8000 | http://budolid:8000 |
| budolAccounting | http://budolaccounting.budol.internal:8005 | http://budolaccounting:8005 |
| budolPay Gateway | http://budolpay-gateway.budol.internal:8080 | http://budolpay-gateway:8080 |
| budolPay Auth | http://budolpay-auth.budol.internal:8001 | http://budolpay-auth:8001 |
| budolPay Wallet | http://budolpay-wallet.budol.internal:8002 | http://budolpay-wallet:8002 |
| budolPay Transaction | http://budolpay-transaction.budol.internal:8003 | http://budolpay-transaction:8003 |
| budolPay Payment | http://budolpay-payment.budol.internal:8004 | http://budolpay-payment:8004 |
| budolPay KYC | http://budolpay-kyc.budol.internal:8006 | http://budolpay-kyc:8006 |
| budolPay Settlement | http://budolpay-settlement.budol.internal:8007 | http://budolpay-settlement:8007 |

### Verification Steps

#### 1. Verify ALB is Running

```bash
# Get ALB DNS names
aws cloudformation describe-stacks \
  --stack-name budolEcosystem-ECS \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text

aws cloudformation describe-stacks \
  --stack-name budolEcosystem-ECS \
  --query 'Stacks[0].Outputs[?OutputKey==`InternalALBDNSName`].OutputValue' \
  --output text
```

#### 2. Verify Target Groups are Healthy

```bash
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:ap-southeast-1:123456789012:targetgroup/budolID-tg/xxxxx \
  --query 'TargetHealthDescriptions[].TargetHealth.State' \
  --output table
```

#### 3. Verify DNS Resolution

From an EC2 instance in the VPC:

```bash
# Test internal DNS resolution
nslookup budolid.budol.internal
nslookup budolpay-gateway.budol.internal

# Test HTTP connectivity
curl http://budolid.budol.internal/health
curl http://budolpay-gateway.budol.internal/health
```

#### 4. Verify Route 53 Records

```bash
# List all records in the hosted zone
aws route53 list-resource-record-sets \
  --hosted-zone-id ZXXXXXXXXXXXXX \
  --query 'ResourceRecordSets[?Type==`A`].Name' \
  --output table
```

#### 5. Test External ALB

```bash
# Test HTTPS access
curl -k https://api.budolpay.yourdomain.com/health

# Test HTTP redirect
curl -I http://api.budolpay.yourdomain.com
# Should return 301 redirect to HTTPS
```

### Troubleshooting

#### Target Group Not Healthy

1. Check if ECS task is running:
   ```bash
   aws ecs list-tasks --cluster budolEcosystem-production --service-name budolID
   ```

2. Check task logs:
   ```bash
   aws logs tail /ecs/budolID --follow --region ap-southeast-1
   ```

3. Verify security group allows traffic from ALB to ECS tasks

#### DNS Resolution Failing

1. Verify Route 53 records are created:
   ```bash
   aws route53 list-resource-record-sets \
     --hosted-zone-id ZXXXXXXXXXXXXX \
     --query "ResourceRecordSets[?contains(Name, 'budol.internal')]"
   ```

2. Verify VPC DNS settings are enabled:
   ```bash
   aws ec2 describe-vpc-attribute --vpc-id vpc-xxxxxxxx --attribute enableDnsHostnames
   aws ec2 describe-vpc-attribute --vpc-id vpc-xxxxxxxx --attribute enableDnsSupport
   ```

#### SSL Certificate Issues

1. Verify ACM certificate exists:
   ```bash
   aws acm list-certificates --region ap-southeast-1
   ```

2. Verify certificate is in the same region as ALB

### Updating SSM Parameters

Apply the updated SSM parameters:

```bash
cat ssm-ecs-production.json | jq -r '.commands[]' | while read cmd; do
  eval "$cmd"
done
```

Make sure to replace placeholder values:
- `ALB_EXTERNAL_DNS_NAME`: From CloudFormation output
- `ALB_INTERNAL_DNS_NAME`: From CloudFormation output
- `HOSTED_ZONE_ID`: Your Route 53 Private Hosted Zone ID

---

## E2E Checkout Flow Validation

### Overview

The E2E checkout flow validation tests the complete transaction path through all budolEcosystem services, ensuring end-to-end functionality from user authentication to payment processing and transaction recording.

### Test Script Location

```
scripts/test_scripts/e2e-checkout-flow.mjs
```

### Test Coverage

The E2E test validates the following flow:

| Phase | Service | Validation |
|-------|---------|------------|
| 1 | All Services | Health check for all 8 microservices |
| 2 | budolID (SSO) | User registration flow |
| 3 | budolID | Login and JWT token validation |
| 4 | budolshap | Product browsing and category listing |
| 5 | budolshap | Cart operations (add, update, calculate total) |
| 6 | budolshap | Checkout flow initiation |
| 7 | budolPay Gateway | Payment processing and intent creation |
| 8 | budolAccounting | Transaction recording and retrieval |
| 9 | budolPay Wallet | Balance updates and transaction history |
| 10 | Integration | Full end-to-end flow validation |

### Running the E2E Tests

#### Prerequisites

1. Ensure all ECS services are deployed and running
2. Configure environment variables or use default local configuration
3. Install dependencies: `npm install node-fetch`

#### Usage

```bash
# Run against local environment (default)
node scripts/test_scripts/e2e-checkout-flow.mjs

# Run against production environment
node scripts/test_scripts/e2e-checkout-flow.mjs --env=production

# Run against staging environment
node scripts/test_scripts/e2e-checkout-flow.mjs --env=staging

# Skip authentication tests
node scripts/test_scripts/e2e-checkout-flow.mjs --skip-auth

# Skip payment tests
node scripts/test_scripts/e2e-checkout-flow.mjs --skip-payment

# Verbose output
node scripts/test_scripts/e2e-checkout-flow.mjs --verbose
```

#### Environment Configuration

The test script supports three environments:

| Environment | Services |
|-------------|----------|
| local | localhost:3001, localhost:8000, etc. |
| staging | staging.budolshap.duckdns.org, etc. |
| production | budolshap.budol.duckdns.org, etc. |

### Test Results Output

```
╔══════════════════════════════════════════════════════════════╗
║  BudolEcosystem E2E Checkout Flow Validation Test           ║
║  Version: 1.0.0                                             ║
╚══════════════════════════════════════════════════════════════╝

🚀 Running in PRODUCTION environment
📅 Test Run: 2026-03-02T10:00:00.000Z

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 1: Service Health Checks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ [PASS] budolID SSO Health Check
✅ [PASS] budolShap Health Check
✅ [PASS] budolPay Gateway Health Check
...

📊 Total Tests: 25
✅ Passed: 24
❌ Failed: 1
⚠️  Warnings: 0

📈 Success Rate: 96.0%
```

### Production Endpoints

| Service | Production URL |
|---------|---------------|
| budolID SSO | https://budolid.budol.duckdns.org |
| budolShap | https://budolshap.budol.duckdns.org |
| budolPay Gateway | https://api.budolpay.budol.duckdns.org |
| WebSocket | wss://wss.budol.duckdns.org |
| Mobile Web | https://budolpaymobile.duckdns.org |

### Manual Validation Steps

If running automated tests is not possible, perform these manual checks:

1. **Service Health**:
   ```bash
   curl https://api.budolpay.budol.duckdns.org/health
   curl https://budolid.budol.duckdns.org/api/health
   ```

2. **User Registration**:
   - Navigate to budolshap registration page
   - Complete registration flow
   - Verify user appears in budolID

3. **Product Browsing**:
   - Navigate to budolshap storefront
   - Browse product categories
   - Add items to cart

4. **Checkout Flow**:
   - Proceed to checkout
   - Enter shipping information
   - Select BUDOL_PAY payment method

5. **Payment Processing**:
   - Confirm payment
   - Verify payment intent created
   - Check transaction in budolAccounting

6. **Wallet Updates**:
   - Login to budolPay mobile app
   - Check wallet balance
   - Verify transaction history

### Troubleshooting

#### Services Not Responding
- Verify ECS tasks are running: `aws ecs list-tasks --cluster budolEcosystem-production`
- Check CloudWatch logs for errors
- Verify ALB target groups are healthy

#### Authentication Failures
- Verify budolID service is accessible
- Check JWT secret configuration
- Verify database connectivity

#### Payment Failures
- Check budolPay Gateway logs
- Verify payment provider configuration
- Ensure sufficient wallet balance

#### Wallet Balance Issues
- Verify budolPay Wallet service health
- Check transaction recording in budolAccounting
- Verify Redis cache connectivity

---

## Mobile App Configuration

### Production Build

The mobile app (budolPay 1.3.71) is built with production endpoints:

```bash
# Android APK
flutter build apk --release \
  --dart-define=GATEWAY_URL=https://api.budolpay.budol.duckdns.org

# iOS
flutter build ios --release \
  --dart-define=GATEWAY_URL=https://api.budolpay.budol.duckdns.org
```

### WebSocket Configuration

- **Production**: wss://wss.budol.duckdns.org
- **Development**: ws://localhost:4000

### Amplify Deployment

- **Mobile Web URL**: https://budolpaymobile.duckdns.org
- **Build Spec**: `amplify-budolpaymobile-buildspec.yml`

---

## Quick Reference

### Service URLs (Production)

| Service | Internal URL | External URL |
|---------|--------------|--------------|
| budolID | http://budolid.budol.internal:8000 | https://budolid.budol.duckdns.org |
| budolAccounting | http://budolaccounting.budol.internal:8005 | - |
| budolPay Gateway | http://budolpay-gateway.budol.internal:8080 | https://api.budolpay.budol.duckdns.org |
| budolPay Auth | http://budolpay-auth.budol.internal:8001 | - |
| budolPay Wallet | http://budolpay-wallet.budol.internal:8002 | - |
| budolPay Transaction | http://budolpay-transaction.budol.internal:8003 | - |
| budolPay Payment | http://budolpay-payment.budol.internal:8004 | - |
| budolPay KYC | http://budolpay-kyc.budol.internal:8006 | - |
| budolPay Settlement | http://budolpay-settlement.budol.internal:8007 | - |

### Key Commands

```bash
# Deploy to ECS
./scripts/ecs-deploy.sh production all

# Verify deployment
./scripts/ecs-verify.sh

# Run E2E tests
node scripts/test_scripts/e2e-checkout-flow.mjs --env=production
```
